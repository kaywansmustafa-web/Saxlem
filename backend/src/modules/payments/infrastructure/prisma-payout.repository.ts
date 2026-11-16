import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import {
  payoutTotals,
  type LedgerEntry,
  type LedgerFilter,
  type PayoutInputs,
  type PayoutPayment,
  type PayoutProfile,
  type PayoutRepository,
  type PayoutTotals,
  type SettledPayout,
} from '../domain/payout';

const ledgerInclude = {
  appointment: {
    select: {
      publicReference: true,
      createdAt: true,
      startsAt: true,
      doctorId: true,
      clinic: { select: { name: true } },
      organization: { select: { name: true } },
      doctorAssignment: {
        select: { doctor: { select: { displayName: true } } },
      },
      patientRegistration: {
        select: {
          patientProfile: { select: { firstName: true, lastName: true } },
        },
      },
    },
  },
} as const;
type LedgerRow = Prisma.AppointmentPaymentGetPayload<{
  include: typeof ledgerInclude;
}>;

const payoutPaymentSelect = {
  id: true,
  amountIqd: true,
  appointment: {
    select: {
      doctorId: true,
      doctorAssignment: {
        select: { doctor: { select: { displayName: true } } },
      },
    },
  },
} as const;
type PayoutRow = Prisma.AppointmentPaymentGetPayload<{
  select: typeof payoutPaymentSelect;
}>;

type Db = Prisma.TransactionClient;

@Injectable()
export class PrismaPayoutRepository implements PayoutRepository {
  constructor(private readonly prisma: PrismaService) {}

  async ledger(filter: LedgerFilter) {
    const rows = await this.prisma.db.appointmentPayment.findMany({
      where: {
        ...(filter.organizationId
          ? { organizationId: filter.organizationId }
          : {}),
        ...(filter.method ? { method: filter.method } : {}),
        // Paid payments by when they were paid; open ones by when they started.
        OR: [
          { paidAt: { gte: filter.from, lt: filter.to } },
          { paidAt: null, createdAt: { gte: filter.from, lt: filter.to } },
        ],
      },
      include: ledgerInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: filter.pageSize + 1,
      ...(filter.cursor ? { cursor: { id: filter.cursor }, skip: 1 } : {}),
    });
    const page = rows.slice(0, filter.pageSize);
    return {
      items: page.map((row) => this.ledgerEntry(row)),
      nextCursor:
        rows.length > filter.pageSize ? (page.at(-1)?.id ?? null) : null,
    };
  }

  async organizations() {
    return this.prisma.db.organization.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  async inputs(organizationId: string, start: Date, end: Date) {
    return this.read(this.prisma.db, organizationId, start, end);
  }

  async settle(input: {
    organizationId: string;
    start: Date;
    end: Date;
    expected: PayoutTotals;
    feeBps: number;
    feePassedToClinic: boolean;
    reference: string;
    note: string | null;
    actorUserId: string;
    requestId: string;
  }): Promise<SettledPayout | null> {
    return this.prisma.db.$transaction(
      async (tx) => {
        // One settlement at a time per organization.
        await tx.$queryRaw`SELECT "id" FROM "organizations" WHERE "id" = ${input.organizationId}::uuid FOR UPDATE`;
        const current = await this.read(
          tx,
          input.organizationId,
          input.start,
          input.end,
        );
        if (current.settled) return null;
        const totals = payoutTotals(
          current,
          input.feeBps,
          input.feePassedToClinic,
        );
        if (
          (Object.keys(totals) as (keyof PayoutTotals)[]).some(
            (key) => totals[key] !== input.expected[key],
          )
        )
          return null;
        const payout = await tx.organizationPayout.create({
          data: {
            organizationId: input.organizationId,
            periodStart: input.start,
            periodEnd: input.end,
            ...totals,
            reference: input.reference,
            note: input.note,
            settledAt: new Date(),
            settledById: input.actorUserId,
          },
        });
        if (current.payments.length)
          await tx.appointmentPayment.updateMany({
            where: {
              id: { in: current.payments.map((p) => p.id) },
              payoutId: null,
            },
            data: { payoutId: payout.id },
          });
        if (current.clawbacks.length)
          await tx.appointmentPayment.updateMany({
            where: {
              id: { in: current.clawbacks.map((p) => p.id) },
              clawbackPayoutId: null,
            },
            data: { clawbackPayoutId: payout.id },
          });
        await tx.auditEvent.create({
          data: {
            actorUserId: input.actorUserId,
            organizationId: input.organizationId,
            action: 'payment.payout_settled',
            targetType: 'OrganizationPayout',
            targetId: payout.id,
            outcome: 'succeeded',
            requestId: input.requestId,
            metadata: {
              periodStart: input.start.toISOString(),
              netPayableIqd: totals.netPayableIqd,
              paymentCount: totals.paymentCount,
            },
            occurredAt: new Date(),
          },
        });
        return this.settled(payout);
      },
      { isolationLevel: 'Serializable' },
    );
  }

  async profile(organizationId: string) {
    const row = await this.prisma.db.organizationPayoutProfile.findUnique({
      where: { organizationId },
    });
    return row ? this.profileRecord(row) : null;
  }

  async saveProfile(
    organizationId: string,
    input: {
      onlinePaymentsEnabled: boolean;
      payoutAccountName: string | null;
      payoutAccountNumber: string | null;
    },
    actorUserId: string,
    requestId: string,
  ) {
    return this.prisma.db.$transaction(async (tx) => {
      const row = await tx.organizationPayoutProfile.upsert({
        where: { organizationId },
        create: { organizationId, ...input },
        update: { ...input, version: { increment: 1 } },
      });
      await tx.auditEvent.create({
        data: {
          actorUserId,
          organizationId,
          action: 'payment.payout_profile_updated',
          targetType: 'OrganizationPayoutProfile',
          targetId: organizationId,
          outcome: 'succeeded',
          requestId,
          metadata: {
            onlinePaymentsEnabled: input.onlinePaymentsEnabled,
            payoutAccountSet: input.payoutAccountNumber !== null,
          },
          occurredAt: new Date(),
        },
      });
      return this.profileRecord(row);
    });
  }

  private async read(
    db: Db,
    organizationId: string,
    start: Date,
    end: Date,
  ): Promise<PayoutInputs> {
    const [organization, payments, clawbacks, commission, settled, profile] =
      await Promise.all([
        db.organization.findUniqueOrThrow({
          where: { id: organizationId },
          select: { name: true },
        }),
        // Everything collected for the organization and not yet paid out,
        // up to the end of the month (late confirmations are included).
        db.appointmentPayment.findMany({
          where: {
            organizationId,
            collectedBy: 'platform',
            status: 'paid',
            payoutId: null,
            paidAt: { lt: end },
          },
          select: payoutPaymentSelect,
          orderBy: { id: 'asc' },
        }),
        // Refunded after they were already paid out: taken back now.
        db.appointmentPayment.findMany({
          where: {
            organizationId,
            collectedBy: 'platform',
            status: 'refunded',
            payoutId: { not: null },
            clawbackPayoutId: null,
            refundedAt: { lt: end },
          },
          select: payoutPaymentSelect,
          orderBy: { id: 'asc' },
        }),
        db.commissionLedgerEntry.groupBy({
          by: ['status'],
          where: { organizationId, recognizedAt: { gte: start, lt: end } },
          _sum: { amountIqd: true },
        }),
        db.organizationPayout.findUnique({
          where: {
            organizationId_periodStart: { organizationId, periodStart: start },
          },
        }),
        db.organizationPayoutProfile.findUnique({ where: { organizationId } }),
      ]);
    const settledPayments = settled
      ? await db.appointmentPayment.findMany({
          where: { payoutId: settled.id },
          select: payoutPaymentSelect,
          orderBy: { id: 'asc' },
        })
      : [];
    const commissionIqd = commission.reduce(
      (sum, row) =>
        sum + (row.status === 'earned' ? 1 : -1) * (row._sum.amountIqd ?? 0),
      0,
    );
    return Object.freeze({
      organizationId,
      organizationName: organization.name,
      payments: payments.map((row) => this.payoutPayment(row)),
      clawbacks: clawbacks.map((row) => this.payoutPayment(row)),
      commissionIqd,
      settled: settled ? this.settled(settled) : null,
      settledPayments: settledPayments.map((row) => this.payoutPayment(row)),
      profile: profile ? this.profileRecord(profile) : null,
    });
  }

  private payoutPayment(row: PayoutRow): PayoutPayment {
    return {
      id: row.id,
      amountIqd: row.amountIqd,
      doctorId: row.appointment.doctorId,
      doctorName: row.appointment.doctorAssignment.doctor.displayName,
    };
  }

  private settled(row: {
    id: string;
    grossCollectedIqd: number;
    clawbackIqd: number;
    providerFeeIqd: number;
    commissionIqd: number;
    netPayableIqd: number;
    paymentCount: number;
    reference: string;
    note: string | null;
    settledAt: Date;
  }): SettledPayout {
    return Object.freeze({
      id: row.id,
      grossCollectedIqd: row.grossCollectedIqd,
      clawbackIqd: row.clawbackIqd,
      providerFeeIqd: row.providerFeeIqd,
      commissionIqd: row.commissionIqd,
      netPayableIqd: row.netPayableIqd,
      paymentCount: row.paymentCount,
      reference: row.reference,
      note: row.note,
      settledAt: row.settledAt,
    });
  }

  private profileRecord(row: {
    organizationId: string;
    onlinePaymentsEnabled: boolean;
    payoutAccountName: string | null;
    payoutAccountNumber: string | null;
    version: number;
  }): PayoutProfile {
    return Object.freeze({
      organizationId: row.organizationId,
      onlinePaymentsEnabled: row.onlinePaymentsEnabled,
      payoutAccountName: row.payoutAccountName,
      payoutAccountNumber: row.payoutAccountNumber,
      version: row.version,
    });
  }

  private ledgerEntry(row: LedgerRow): LedgerEntry {
    const profile = row.appointment.patientRegistration.patientProfile;
    return Object.freeze({
      id: row.id,
      appointmentId: row.appointmentId,
      appointmentReference: row.appointment.publicReference,
      organizationId: row.organizationId,
      organizationName: row.appointment.organization.name,
      clinicId: row.clinicId,
      clinicName: row.appointment.clinic.name,
      doctorId: row.appointment.doctorId,
      doctorName: row.appointment.doctorAssignment.doctor.displayName,
      patientName: `${profile.firstName} ${profile.lastName}`.trim(),
      bookedAt: row.appointment.createdAt,
      appointmentStartsAt: row.appointment.startsAt,
      method: row.method,
      amountIqd: row.amountIqd,
      status: row.status,
      collectedBy: row.collectedBy,
      provider: row.provider,
      payerName: row.payerName,
      paidAt: row.paidAt,
      refundedAt: row.refundedAt,
      payoutId: row.payoutId,
    });
  }
}
