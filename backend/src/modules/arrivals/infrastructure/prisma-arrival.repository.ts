import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type {
  ArrivalAccess,
  ArrivalCommand,
  ArrivalProjection,
} from '../domain/arrival';
import { ArrivalAuditPersistenceError } from '../domain/arrival.errors';
import type { ArrivalRepository } from '../domain/arrival.repository';

const include = {
  appointment: {
    include: {
      organization: { select: { status: true } },
      clinic: { select: { name: true, status: true } },
      doctorAssignment: {
        select: {
          doctor: { select: { displayName: true, status: true } },
        },
      },
      patientRegistration: {
        select: {
          patientProfile: {
            select: { firstName: true, lastName: true, status: true },
          },
        },
      },
    },
  },
} as const;
type Row = Prisma.AppointmentArrivalGetPayload<{ include: typeof include }>;

@Injectable()
export class PrismaArrivalRepository implements ArrivalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async replay(
    access: ArrivalAccess,
    appointmentId: string,
    command: ArrivalCommand,
  ) {
    const existing = await this.prisma.db.idempotencyRecord.findUnique({
      where: {
        actorId_scope_key: {
          actorId: access.actorId,
          scope: command.scope,
          key: command.key,
        },
      },
    });
    if (!existing) return null;
    if (existing.requestHash !== command.hash)
      throw new ConflictException(
        'Idempotency key was already used for a different request.',
      );
    if (!existing.responseBody) return null;
    const response = existing.responseBody as unknown as ArrivalProjection;
    if (response.appointmentId !== appointmentId)
      throw new ConflictException('Idempotency result scope is invalid.');
    return response;
  }

  async get(access: ArrivalAccess, appointmentId: string) {
    const row = await this.prisma.db.appointmentArrival.findFirst({
      where: { appointmentId, ...this.scope(access) },
      include,
    });
    return row ? this.map(row) : null;
  }

  async record(
    access: ArrivalAccess,
    appointmentId: string,
    expectedVersion: number,
    occurredAt: Date,
    requestId: string,
    command: ArrivalCommand,
  ) {
    return this.prisma.db.$transaction(async (tx) => {
      const replay = await this.beginCommand(tx, access, command);
      if (replay) return replay;
      let current = await tx.appointmentArrival.findFirst({
        where: { appointmentId, ...this.scope(access) },
        include,
      });
      if (!current) throw new NotFoundException('Arrival was not found.');
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${current.organizationId}:${current.appointment.doctorId}`}, 0))`;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`patient:${current.organizationId}:${current.patientProfileId}`}, 0))`;
      await tx.$queryRaw`SELECT "id" FROM "appointments" WHERE "id" = ${appointmentId}::uuid FOR UPDATE`;
      current = await tx.appointmentArrival.findFirst({
        where: { appointmentId, ...this.scope(access) },
        include,
      });
      if (!current) throw new NotFoundException('Arrival was not found.');
      this.validateContext(current);
      if (current.version !== expectedVersion)
        throw new ConflictException('Arrival version is stale.');
      if (current.status !== 'expected')
        throw new ConflictException('Arrival has already been recorded.');

      const arrived = await tx.appointmentArrival.update({
        where: { id: current.id },
        data: {
          status: 'arrived',
          arrivedAt: occurredAt,
          version: { increment: 1 },
        },
        include,
      });
      await this.arrivalAudit(
        tx,
        access,
        arrived,
        'expected',
        'arrived',
        occurredAt,
      );
      const ready = await tx.appointmentArrival.update({
        where: { id: arrived.id },
        data: {
          status: 'queueReady',
          queueReadyAt: occurredAt,
          version: { increment: 1 },
        },
        include,
      });
      await this.arrivalAudit(
        tx,
        access,
        ready,
        'arrived',
        'queueReady',
        occurredAt,
      );
      await this.commandAudit(tx, access, ready, requestId, occurredAt);
      const result = this.map(ready);
      await this.completeCommand(tx, access, command, result);
      return result;
    });
  }

  async auditView(
    access: ArrivalAccess,
    arrival: ArrivalProjection,
    requestId: string,
  ) {
    if (access.patient) return;
    await this.prisma.db.auditEvent.create({
      data: {
        actorUserId: access.actorId,
        organizationId: arrival.organizationId,
        clinicId: arrival.clinicId,
        action: 'arrival.viewed',
        targetType: 'AppointmentArrival',
        targetId: arrival.id,
        outcome: 'succeeded',
        requestId,
        occurredAt: new Date(),
      },
    });
  }

  private validateContext(row: Row) {
    if (!['scheduled', 'confirmed'].includes(row.appointment.status))
      throw new ConflictException(
        'Cancelled, completed, or no-show appointments cannot arrive.',
      );
    if (row.appointment.organization.status !== 'active')
      throw new BadRequestException('Organization is inactive.');
    if (row.appointment.clinic.status !== 'active')
      throw new BadRequestException('Clinic is inactive.');
    if (row.appointment.doctorAssignment.doctor.status !== 'active')
      throw new BadRequestException('Doctor is inactive.');
    if (row.appointment.patientRegistration.patientProfile.status !== 'active')
      throw new BadRequestException('Patient registration is inactive.');
  }

  private scope(access: ArrivalAccess): Prisma.AppointmentArrivalWhereInput {
    if (access.patient)
      return {
        appointment: {
          patientRegistration: {
            patientProfile: { patientAccount: { userId: access.actorId } },
          },
        },
      };
    if (access.doctor)
      return {
        appointment: {
          doctorAssignment: {
            doctor: { staffAccount: { userId: access.actorId } },
          },
        },
      };
    if (access.platformAdministrator) return {};
    if (!access.organizationId || !access.clinicId)
      throw new ForbiddenException('Staff tenant context is required.');
    return {
      organizationId: access.organizationId,
      clinicId: access.clinicId,
    };
  }

  private async beginCommand(
    tx: Prisma.TransactionClient,
    access: ArrivalAccess,
    command: ArrivalCommand,
  ) {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${access.actorId}:${command.scope}:${command.key}`}, 0))`;
    const existing = await tx.idempotencyRecord.findUnique({
      where: {
        actorId_scope_key: {
          actorId: access.actorId,
          scope: command.scope,
          key: command.key,
        },
      },
    });
    if (existing) {
      if (existing.requestHash !== command.hash)
        throw new ConflictException(
          'Idempotency key was already used for a different request.',
        );
      if (existing.responseBody)
        return existing.responseBody as unknown as ArrivalProjection;
      throw new ConflictException(
        'The arrival command is already in progress.',
      );
    }
    await tx.idempotencyRecord.create({
      data: {
        actorId: access.actorId,
        scope: command.scope,
        key: command.key,
        requestHash: command.hash,
        expiresAt: new Date(Date.now() + 86_400_000),
      },
    });
    return null;
  }

  private async completeCommand(
    tx: Prisma.TransactionClient,
    access: ArrivalAccess,
    command: ArrivalCommand,
    response: ArrivalProjection,
  ) {
    await tx.idempotencyRecord.update({
      where: {
        actorId_scope_key: {
          actorId: access.actorId,
          scope: command.scope,
          key: command.key,
        },
      },
      data: {
        responseCode: 201,
        responseBody: response as unknown as Prisma.InputJsonValue,
      },
    });
  }

  private async arrivalAudit(
    tx: Prisma.TransactionClient,
    access: ArrivalAccess,
    row: Row,
    fromStatus: 'expected' | 'arrived',
    toStatus: 'arrived' | 'queueReady',
    occurredAt: Date,
  ) {
    try {
      await tx.arrivalAudit.create({
        data: {
          organizationId: row.organizationId,
          clinicId: row.clinicId,
          arrivalId: row.id,
          actorUserId: access.actorId,
          fromStatus,
          toStatus,
          occurredAt,
        },
      });
    } catch {
      throw new ArrivalAuditPersistenceError();
    }
  }

  private async commandAudit(
    tx: Prisma.TransactionClient,
    access: ArrivalAccess,
    row: Row,
    requestId: string,
    occurredAt: Date,
  ) {
    try {
      await tx.auditEvent.create({
        data: {
          actorUserId: access.actorId,
          organizationId: row.organizationId,
          clinicId: row.clinicId,
          action: 'arrival.recorded',
          targetType: 'AppointmentArrival',
          targetId: row.id,
          outcome: 'succeeded',
          requestId,
          occurredAt,
        },
      });
    } catch {
      throw new ArrivalAuditPersistenceError();
    }
  }

  private map(row: Row): ArrivalProjection {
    return Object.freeze({
      id: row.id,
      appointmentId: row.appointmentId,
      appointmentReference: row.appointment.publicReference,
      organizationId: row.organizationId,
      clinicId: row.clinicId,
      clinicName: row.appointment.clinic.name,
      doctorId: row.appointment.doctorId,
      doctorName: row.appointment.doctorAssignment.doctor.displayName,
      patientProfileId: row.patientProfileId,
      patientName: `${row.appointment.patientRegistration.patientProfile.firstName} ${row.appointment.patientRegistration.patientProfile.lastName}`,
      appointmentStartsAt: row.appointment.startsAt.toISOString(),
      status: row.status,
      arrivedAt: row.arrivedAt?.toISOString() ?? null,
      queueReadyAt: row.queueReadyAt?.toISOString() ?? null,
      version: row.version,
    });
  }
}
