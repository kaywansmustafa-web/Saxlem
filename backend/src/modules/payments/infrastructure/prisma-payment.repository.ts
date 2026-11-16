import { ForbiddenException, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type {
  PaymentAccess,
  PaymentAccountRecord,
  PaymentRecord,
} from '../domain/payment';
import type {
  PaymentAccountWrite,
  PaymentAudit,
  PaymentPatch,
  PaymentRepository,
  PaymentWrite,
} from '../domain/payment.repository';

const include = { appointment: { select: { status: true } } } as const;
type Row = Prisma.AppointmentPaymentGetPayload<{ include: typeof include }>;

@Injectable()
export class PrismaPaymentRepository implements PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByAppointment(appointmentId: string) {
    const row = await this.prisma.db.appointmentPayment.findUnique({
      where: { appointmentId },
      include,
    });
    return row ? this.map(row) : null;
  }

  async findByCallbackToken(callbackToken: string) {
    const row = await this.prisma.db.appointmentPayment.findUnique({
      where: { callbackToken },
      include,
    });
    return row ? this.map(row) : null;
  }

  async listForAppointments(
    access: PaymentAccess,
    appointmentIds: readonly string[],
  ) {
    const rows = await this.prisma.db.appointmentPayment.findMany({
      where: {
        appointmentId: { in: [...appointmentIds] },
        ...this.scope(access),
      },
      include,
    });
    return rows.map((row) => this.map(row));
  }

  async save(
    appointment: { id: string; organizationId: string; clinicId: string },
    expectedVersion: number,
    write: PaymentWrite,
    callbackToken: string,
    audit: PaymentAudit,
  ) {
    return this.prisma.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "appointments" WHERE "id" = ${appointment.id}::uuid FOR UPDATE`;
      const current = await tx.appointmentPayment.findUnique({
        where: { appointmentId: appointment.id },
      });
      if ((current?.version ?? 0) !== expectedVersion) return null;
      const data = {
        method: write.method,
        provider: write.provider,
        status: write.status,
        amountIqd: write.amountIqd,
        providerPaymentId: write.providerPaymentId,
        readableCode: write.readableCode,
        qrCode: write.qrCode,
        personalAppLink: write.personalAppLink,
        businessAppLink: write.businessAppLink,
        validUntil: write.validUntil,
        paidAt: write.paidAt,
        recordedByUserId: write.recordedByUserId,
        failureReason: write.failureReason,
        refundedAt: null,
        lastCheckedAt: null,
        callbackToken,
      };
      const row = current
        ? await tx.appointmentPayment.update({
            where: { id: current.id },
            data: { ...data, version: { increment: 1 } },
            include,
          })
        : await tx.appointmentPayment.create({
            data: {
              ...data,
              organizationId: appointment.organizationId,
              clinicId: appointment.clinicId,
              appointmentId: appointment.id,
            },
            include,
          });
      await this.audit(tx, row, audit);
      return this.map(row);
    });
  }

  async patch(
    record: PaymentRecord,
    patch: PaymentPatch,
    audit?: PaymentAudit,
  ) {
    return this.prisma.db.$transaction(async (tx) => {
      const updated = await tx.appointmentPayment.updateMany({
        where: { id: record.id, version: record.version },
        data: { ...patch, version: { increment: 1 } },
      });
      if (updated.count === 0) return null;
      const row = await tx.appointmentPayment.findUniqueOrThrow({
        where: { id: record.id },
        include,
      });
      if (audit) await this.audit(tx, row, audit);
      return this.map(row);
    });
  }

  async dueForReconciliation(checkedBefore: Date, limit: number) {
    const rows = await this.prisma.db.appointmentPayment.findMany({
      where: {
        OR: [
          {
            status: 'pending',
            OR: [
              { lastCheckedAt: null },
              { lastCheckedAt: { lt: checkedBefore } },
            ],
          },
          { status: 'refundPending' },
          {
            status: { in: ['dueAtCounter', 'paid'] },
            appointment: { status: 'cancelled' },
            OR: [{ method: 'online' }, { status: 'dueAtCounter' }],
          },
        ],
      },
      orderBy: { updatedAt: 'asc' },
      take: limit,
      include,
    });
    return rows.map((row) => this.map(row));
  }

  async clinicOrganization(clinicId: string) {
    const clinic = await this.prisma.db.clinic.findFirst({
      where: {
        id: clinicId,
        status: 'active',
        organization: { status: 'active' },
      },
      select: { organizationId: true },
    });
    return clinic?.organizationId ?? null;
  }

  async account(organizationId: string): Promise<PaymentAccountRecord | null> {
    const row = await this.prisma.db.organizationPaymentAccount.findUnique({
      where: { organizationId },
    });
    if (!row) return null;
    return Object.freeze({
      organizationId: row.organizationId,
      provider: row.provider,
      environment: row.environment,
      clientId: row.clientId,
      clientSecretCiphertext: row.clientSecretCiphertext,
      onlineEnabled: row.onlineEnabled,
      version: row.version,
      updatedAt: row.updatedAt,
    });
  }

  async saveAccount(
    organizationId: string,
    write: PaymentAccountWrite,
    audit: PaymentAudit,
  ) {
    await this.prisma.db.$transaction(async (tx) => {
      await tx.organizationPaymentAccount.upsert({
        where: { organizationId },
        create: { organizationId, ...write },
        update: { ...write, version: { increment: 1 } },
      });
      await tx.auditEvent.create({
        data: {
          actorUserId: audit.actorUserId,
          organizationId,
          action: audit.action,
          targetType: 'OrganizationPaymentAccount',
          targetId: organizationId,
          outcome: 'succeeded',
          requestId: audit.requestId,
          ...(audit.metadata ? { metadata: audit.metadata } : {}),
          occurredAt: new Date(),
        },
      });
    });
    const saved = await this.account(organizationId);
    if (!saved) throw new Error('Payment account was not saved.');
    return saved;
  }

  async organizationExists(organizationId: string) {
    return (
      (await this.prisma.db.organization.count({
        where: { id: organizationId },
      })) > 0
    );
  }

  private scope(access: PaymentAccess): Prisma.AppointmentPaymentWhereInput {
    if (access.platformAdministrator) return {};
    if (access.patient || access.doctor)
      throw new ForbiddenException('Clinic staff access is required.');
    if (!access.organizationId || !access.clinicId)
      throw new ForbiddenException('Staff tenant context is required.');
    return { organizationId: access.organizationId, clinicId: access.clinicId };
  }

  private async audit(
    tx: Prisma.TransactionClient,
    row: Row,
    audit: PaymentAudit,
  ) {
    await tx.auditEvent.create({
      data: {
        actorUserId: audit.actorUserId,
        organizationId: row.organizationId,
        clinicId: row.clinicId,
        action: audit.action,
        targetType: 'AppointmentPayment',
        targetId: row.id,
        outcome: 'succeeded',
        requestId: audit.requestId,
        metadata: {
          method: row.method,
          status: row.status,
          ...(audit.metadata ?? {}),
        },
        occurredAt: new Date(),
      },
    });
  }

  private map(row: Row): PaymentRecord {
    return Object.freeze({
      id: row.id,
      organizationId: row.organizationId,
      clinicId: row.clinicId,
      appointmentId: row.appointmentId,
      appointmentStatus: row.appointment.status,
      method: row.method,
      provider: row.provider,
      status: row.status,
      amountIqd: row.amountIqd,
      providerPaymentId: row.providerPaymentId,
      readableCode: row.readableCode,
      qrCode: row.qrCode,
      personalAppLink: row.personalAppLink,
      businessAppLink: row.businessAppLink,
      validUntil: row.validUntil,
      paidAt: row.paidAt,
      recordedByUserId: row.recordedByUserId,
      refundedAt: row.refundedAt,
      failureReason: row.failureReason,
      callbackToken: row.callbackToken,
      lastCheckedAt: row.lastCheckedAt,
      version: row.version,
    });
  }
}
