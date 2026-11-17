import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { baghdadDay, dateOnly } from '../../../common/billing/billing-cycle';
import type {
  StatementActivity,
  StatementDoctor,
  StatementFacts,
  StatementLines,
  StatementRepository,
  StatementSettlement,
  StatementWindow,
} from '../domain/statement';

type Db = Prisma.TransactionClient;

const doctorSelect = {
  id: true,
  organizationId: true,
  displayName: true,
  organization: {
    select: { name: true, billingCycleStart: true, createdAt: true },
  },
  clinicAssignments: {
    where: { status: 'active' },
    select: { clinic: { select: { name: true } } },
  },
  payoutProfile: {
    select: { payoutAccountName: true, payoutAccountNumber: true },
  },
  payouts: {
    include: {
      settledBy: { select: { staffAccount: { select: { email: true } } } },
    },
    orderBy: { periodStart: 'asc' },
  },
} as const satisfies Prisma.DoctorSelect;
type DoctorRow = Prisma.DoctorGetPayload<{ select: typeof doctorSelect }>;

const chargeInclude = {
  appointment: { select: { publicReference: true, startsAt: true } },
  clinic: { select: { name: true } },
  plan: { select: { displayName: true } },
} as const;
const moneySelect = {
  id: true,
  amountIqd: true,
  paidAt: true,
  refundedAt: true,
  appointment: { select: { publicReference: true } },
} as const;

@Injectable()
export class PrismaStatementRepository implements StatementRepository {
  constructor(private readonly prisma: PrismaService) {}

  async doctor(organizationId: string, doctorId: string) {
    const row = await this.prisma.db.doctor.findFirst({
      where: { id: doctorId, organizationId },
      select: doctorSelect,
    });
    return row ? this.doctorRecord(row) : null;
  }

  async doctors(organizationId?: string) {
    const rows = await this.prisma.db.doctor.findMany({
      where: {
        ...(organizationId ? { organizationId } : {}),
        OR: [
          {
            status: 'active',
            clinicAssignments: { some: { status: 'active' } },
          },
          { commissions: { some: {} } },
          { payouts: { some: {} } },
          {
            clinicAssignments: {
              some: {
                appointments: {
                  some: {
                    payment: {
                      collectedBy: 'platform',
                      status: { in: ['paid', 'refunded'] },
                    },
                  },
                },
              },
            },
          },
        ],
      },
      select: doctorSelect,
    });
    return Object.freeze(
      rows
        .map((row) => this.doctorRecord(row))
        .sort(
          (a, b) =>
            a.organizationName.localeCompare(b.organizationName) ||
            a.doctorName.localeCompare(b.doctorName),
        ),
    );
  }

  async activity(doctor: StatementDoctor): Promise<StatementActivity> {
    const db = this.prisma.db;
    const [charges, payments, clawbacks] = await Promise.all([
      db.commissionLedgerEntry.findMany({
        where: {
          organizationId: doctor.organizationId,
          doctorId: doctor.doctorId,
        },
        select: { recognizedAt: true },
      }),
      db.appointmentPayment.findMany({
        where: this.unpaidOut(doctor),
        select: { paidAt: true },
      }),
      db.appointmentPayment.findMany({
        where: this.unclawed(doctor),
        select: { refundedAt: true },
      }),
    ]);
    return Object.freeze({
      charges: charges
        .map((row) => row.recognizedAt)
        .filter((at) => !this.covered(doctor.settlements, at)),
      payments: payments.map((row) => row.paidAt!),
      clawbacks: clawbacks.map((row) => row.refundedAt!),
    });
  }

  openLines(doctor: StatementDoctor, window: StatementWindow) {
    return this.lines(this.prisma.db, doctor, window);
  }

  async settledLines(doctor: StatementDoctor, settlement: StatementSettlement) {
    const db = this.prisma.db;
    const [charges, payments, clawbacks] = await Promise.all([
      db.commissionLedgerEntry.findMany({
        where: {
          organizationId: doctor.organizationId,
          doctorId: doctor.doctorId,
          recognizedAt: {
            gte: settlement.windowStart,
            lt: settlement.periodEnd,
          },
        },
        include: chargeInclude,
        orderBy: [{ recognizedAt: 'asc' }, { id: 'asc' }],
      }),
      db.appointmentPayment.findMany({
        where: { payoutId: settlement.id },
        select: moneySelect,
        orderBy: [{ paidAt: 'asc' }, { id: 'asc' }],
      }),
      db.appointmentPayment.findMany({
        where: { clawbackPayoutId: settlement.id },
        select: moneySelect,
        orderBy: [{ refundedAt: 'asc' }, { id: 'asc' }],
      }),
    ]);
    return this.linesRecord(charges, payments, clawbacks);
  }

  async facts(
    doctor: StatementDoctor,
    from: Date,
    to: Date,
  ): Promise<StatementFacts> {
    const db = this.prisma.db;
    const where = {
      organizationId: doctor.organizationId,
      doctorId: doctor.doctorId,
      startsAt: { gte: from, lt: to },
    };
    const [byStatus, byOrigin, revenue] = await Promise.all([
      db.appointment.groupBy({ by: ['status'], where, _count: { _all: true } }),
      db.appointment.groupBy({
        by: ['origin'],
        where: { ...where, status: { not: 'cancelled' } },
        _count: { _all: true },
      }),
      db.appointmentPayment.groupBy({
        by: ['method'],
        where: {
          organizationId: doctor.organizationId,
          appointment: { doctorId: doctor.doctorId },
          status: 'paid',
          paidAt: { gte: from, lt: to },
        },
        _count: { _all: true },
        _sum: { amountIqd: true },
      }),
    ]);
    const status = (name: string) =>
      byStatus.find((row) => row.status === name)?._count._all ?? 0;
    const origin = (name: string | null) =>
      byOrigin
        .filter((row) => row.origin === name)
        .reduce((sum, row) => sum + row._count._all, 0);
    const method = (name: 'counter' | 'online') =>
      revenue.find((row) => row.method === name);
    return Object.freeze({
      visits: {
        total: byStatus.reduce((sum, row) => sum + row._count._all, 0),
        completed: status('completed'),
        noShow: status('noShow'),
        cancelled: status('cancelled'),
        upcoming: status('scheduled') + status('confirmed'),
        // Bookings from before origins were recorded came from the app.
        app: origin('patientBooked') + origin(null),
        phone: origin('clinicCreated'),
        walkIn: origin('walkIn'),
      },
      revenue: {
        counterIqd: method('counter')?._sum.amountIqd ?? 0,
        counterCount: method('counter')?._count._all ?? 0,
        onlineIqd: method('online')?._sum.amountIqd ?? 0,
        onlineCount: method('online')?._count._all ?? 0,
      },
    });
  }

  async settle(input: Parameters<StatementRepository['settle']>[0]) {
    const { doctor } = input;
    return this.prisma.db.$transaction(
      async (tx) => {
        // One settlement at a time per doctor.
        await tx.$queryRaw`SELECT "id" FROM "doctors" WHERE "id" = ${doctor.doctorId}::uuid AND "organization_id" = ${doctor.organizationId}::uuid FOR UPDATE`;
        const settlements = await tx.organizationPayout.findMany({
          where: {
            organizationId: doctor.organizationId,
            doctorId: doctor.doctorId,
          },
          include: {
            settledBy: {
              select: { staffAccount: { select: { email: true } } },
            },
          },
        });
        if (
          settlements.some(
            (row) => row.periodStart.getTime() === input.periodStart.getTime(),
          )
        )
          return null;
        const current = {
          ...doctor,
          settlements: settlements.map((row) => this.settlementRecord(row)),
        };
        const lines = await this.lines(tx, current, input.window);
        const totals = input.totals(lines);
        if (totals.netPayableIqd !== input.expectedNetPayableIqd) return null;
        const payout = await tx.organizationPayout.create({
          data: {
            organizationId: doctor.organizationId,
            doctorId: doctor.doctorId,
            cycleNumber: input.cycleNumber,
            periodStart: input.periodStart,
            periodEnd: input.periodEnd,
            windowStart: input.window.chargesFrom,
            ...totals,
            method: input.method,
            reference: input.reference,
            counterpartyName: input.counterpartyName,
            note: input.note,
            settledAt: new Date(),
            settledById: input.actorUserId,
          },
          include: {
            settledBy: {
              select: { staffAccount: { select: { email: true } } },
            },
          },
        });
        if (lines.payments.length)
          await tx.appointmentPayment.updateMany({
            where: {
              id: { in: lines.payments.map((p) => p.id) },
              payoutId: null,
            },
            data: { payoutId: payout.id },
          });
        if (lines.clawbacks.length)
          await tx.appointmentPayment.updateMany({
            where: {
              id: { in: lines.clawbacks.map((p) => p.id) },
              clawbackPayoutId: null,
            },
            data: { clawbackPayoutId: payout.id },
          });
        await tx.auditEvent.create({
          data: {
            actorUserId: input.actorUserId,
            organizationId: doctor.organizationId,
            action: 'payment.statement_settled',
            targetType: 'OrganizationPayout',
            targetId: payout.id,
            outcome: 'succeeded',
            requestId: input.requestId,
            metadata: {
              doctorId: doctor.doctorId,
              cycleNumber: input.cycleNumber,
              method: input.method,
              netPayableIqd: totals.netPayableIqd,
            },
            occurredAt: new Date(),
          },
        });
        return this.settlementRecord(payout);
      },
      { isolationLevel: 'Serializable' },
    );
  }

  private async lines(
    db: Db,
    doctor: StatementDoctor,
    window: StatementWindow,
  ): Promise<StatementLines> {
    const [charges, payments, clawbacks] = await Promise.all([
      db.commissionLedgerEntry.findMany({
        where: {
          organizationId: doctor.organizationId,
          doctorId: doctor.doctorId,
          recognizedAt: { gte: window.chargesFrom, lt: window.to },
        },
        include: chargeInclude,
        orderBy: [{ recognizedAt: 'asc' }, { id: 'asc' }],
      }),
      db.appointmentPayment.findMany({
        where: {
          ...this.unpaidOut(doctor),
          paidAt: { gte: window.paymentsFrom, lt: window.to },
        },
        select: moneySelect,
        orderBy: [{ paidAt: 'asc' }, { id: 'asc' }],
      }),
      db.appointmentPayment.findMany({
        where: {
          ...this.unclawed(doctor),
          refundedAt: { gte: window.paymentsFrom, lt: window.to },
        },
        select: moneySelect,
        orderBy: [{ refundedAt: 'asc' }, { id: 'asc' }],
      }),
    ]);
    return this.linesRecord(
      charges.filter(
        (row) => !this.covered(doctor.settlements, row.recognizedAt),
      ),
      payments,
      clawbacks,
    );
  }

  private unpaidOut(doctor: StatementDoctor) {
    return {
      organizationId: doctor.organizationId,
      appointment: { doctorId: doctor.doctorId },
      collectedBy: 'platform' as const,
      status: 'paid' as const,
      payoutId: null,
      paidAt: { not: null },
    };
  }
  /** Refunded after Saxlem already paid the doctor: taken back next time. */
  private unclawed(doctor: StatementDoctor) {
    return {
      organizationId: doctor.organizationId,
      appointment: { doctorId: doctor.doctorId },
      collectedBy: 'platform' as const,
      status: 'refunded' as const,
      payoutId: { not: null },
      clawbackPayoutId: null,
      refundedAt: { not: null },
    };
  }
  private covered(settlements: readonly StatementSettlement[], at: Date) {
    return settlements.some(
      (row) => row.windowStart <= at && at < row.periodEnd,
    );
  }

  private linesRecord(
    charges: readonly Prisma.CommissionLedgerEntryGetPayload<{
      include: typeof chargeInclude;
    }>[],
    payments: readonly Prisma.AppointmentPaymentGetPayload<{
      select: typeof moneySelect;
    }>[],
    clawbacks: readonly Prisma.AppointmentPaymentGetPayload<{
      select: typeof moneySelect;
    }>[],
  ): StatementLines {
    return Object.freeze({
      charges: charges.map((row) =>
        Object.freeze({
          id: row.id,
          recognizedAt: row.recognizedAt,
          appointmentReference: row.appointment.publicReference,
          appointmentStartsAt: row.appointment.startsAt,
          clinicName: row.clinic.name,
          planName: row.plan.displayName,
          amountIqd: row.amountIqd,
          status: row.status,
          reason: row.reversalReason,
          originalId: row.originalCommissionId,
        }),
      ),
      payments: payments.map((row) =>
        Object.freeze({
          id: row.id,
          at: row.paidAt!,
          appointmentReference: row.appointment.publicReference,
          amountIqd: row.amountIqd,
        }),
      ),
      clawbacks: clawbacks.map((row) =>
        Object.freeze({
          id: row.id,
          at: row.refundedAt!,
          appointmentReference: row.appointment.publicReference,
          amountIqd: row.amountIqd,
        }),
      ),
    });
  }

  private doctorRecord(row: DoctorRow): StatementDoctor {
    return Object.freeze({
      organizationId: row.organizationId,
      organizationName: row.organization.name,
      doctorId: row.id,
      doctorName: row.displayName,
      cycleStart: row.organization.billingCycleStart
        ? dateOnly(row.organization.billingCycleStart)
        : baghdadDay(row.organization.createdAt),
      clinicNames: [
        ...new Set(row.clinicAssignments.map((a) => a.clinic.name)),
      ].sort(),
      settlements: row.payouts.map((payout) => this.settlementRecord(payout)),
      payoutAccount: row.payoutProfile
        ? {
            name: row.payoutProfile.payoutAccountName,
            number: row.payoutProfile.payoutAccountNumber,
          }
        : null,
    });
  }

  private settlementRecord(row: {
    id: string;
    cycleNumber: number | null;
    periodStart: Date;
    periodEnd: Date;
    windowStart: Date | null;
    method: string;
    reference: string | null;
    counterpartyName: string | null;
    note: string | null;
    settledAt: Date;
    settledBy: { staffAccount: { email: string } | null };
    grossCollectedIqd: number;
    clawbackIqd: number;
    providerFeeIqd: number;
    commissionIqd: number;
    netPayableIqd: number;
    paymentCount: number;
  }): StatementSettlement {
    return Object.freeze({
      id: row.id,
      cycleNumber: row.cycleNumber,
      periodStart: row.periodStart,
      periodEnd: row.periodEnd,
      windowStart: row.windowStart ?? row.periodStart,
      method: row.method === 'cash' ? 'cash' : 'fib',
      reference: row.reference,
      counterpartyName: row.counterpartyName,
      note: row.note,
      settledAt: row.settledAt,
      settledByName: row.settledBy.staffAccount?.email ?? 'Saxlem',
      grossCollectedIqd: row.grossCollectedIqd,
      clawbackIqd: row.clawbackIqd,
      providerFeeIqd: row.providerFeeIqd,
      commissionIqd: row.commissionIqd,
      netPayableIqd: row.netPayableIqd,
      paymentCount: row.paymentCount,
    });
  }
}
