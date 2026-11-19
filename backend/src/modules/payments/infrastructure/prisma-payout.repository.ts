import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type {
  DoctorPayoutProfile,
  LedgerEntry,
  Payee,
  LedgerFilter,
  PayoutProfile,
  PayoutRepository,
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

  async payee(organizationId: string, doctorId: string): Promise<Payee | null> {
    const doctor = await this.prisma.db.doctor.findFirst({
      where: { id: doctorId, organizationId },
      select: {
        id: true,
        organizationId: true,
        displayName: true,
        organization: { select: { name: true } },
      },
    });
    return doctor
      ? Object.freeze({
          organizationId: doctor.organizationId,
          organizationName: doctor.organization.name,
          doctorId: doctor.id,
          doctorName: doctor.displayName,
        })
      : null;
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

  async doctorProfile(organizationId: string, doctorId: string) {
    const row = await this.prisma.db.doctorPayoutProfile.findFirst({
      where: { organizationId, doctorId },
    });
    return row ? this.doctorProfileRecord(row) : null;
  }

  async saveDoctorProfile(
    organizationId: string,
    doctorId: string,
    input: {
      payoutAccountName: string | null;
      payoutAccountNumber: string | null;
    },
    actorUserId: string,
    requestId: string,
  ) {
    return this.prisma.db.$transaction(async (tx) => {
      const row = await tx.doctorPayoutProfile.upsert({
        where: { doctorId },
        create: { organizationId, doctorId, ...input },
        update: { ...input, version: { increment: 1 } },
      });
      await tx.auditEvent.create({
        data: {
          actorUserId,
          organizationId,
          action: 'payment.doctor_payout_profile_updated',
          targetType: 'Doctor',
          targetId: doctorId,
          outcome: 'succeeded',
          requestId,
          metadata: { payoutAccountSet: input.payoutAccountNumber !== null },
          occurredAt: new Date(),
        },
      });
      return this.doctorProfileRecord(row);
    });
  }

  private doctorProfileRecord(row: {
    organizationId: string;
    doctorId: string;
    payoutAccountName: string | null;
    payoutAccountNumber: string | null;
    version: number;
  }): DoctorPayoutProfile {
    return Object.freeze({
      organizationId: row.organizationId,
      doctorId: row.doctorId,
      payoutAccountName: row.payoutAccountName,
      payoutAccountNumber: row.payoutAccountNumber,
      version: row.version,
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
