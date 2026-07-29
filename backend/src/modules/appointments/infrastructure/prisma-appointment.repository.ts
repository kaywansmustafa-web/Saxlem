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
  AppointmentAccess,
  AppointmentProjection,
  AppointmentWrite,
} from '../domain/appointment';
import { AppointmentAuditPersistenceError } from '../domain/appointment.errors';
import type { AppointmentRepository } from '../domain/appointment.repository';
import type {
  AppointmentCommand,
  AppointmentListQuery,
} from '../domain/appointment.repository';

const include = {
  clinic: { select: { name: true } },
  doctorAssignment: { select: { doctor: { select: { displayName: true } } } },
  patientRegistration: {
    select: { patientProfile: { select: { firstName: true, lastName: true } } },
  },
} as const;
type Row = Prisma.AppointmentGetPayload<{ include: typeof include }>;

@Injectable()
export class PrismaAppointmentRepository implements AppointmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async replay(access: AppointmentAccess, command: AppointmentCommand) {
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
    return existing.responseBody
      ? (existing.responseBody as unknown as AppointmentProjection)
      : null;
  }

  async list(access: AppointmentAccess, query: AppointmentListQuery) {
    const where: Prisma.AppointmentWhereInput = {
      ...this.scope(access),
      startsAt: { gte: query.from, lt: query.to },
      ...(query.status ? { status: query.status } : {}),
    };
    if (query.cursor) {
      const cursor = await this.prisma.db.appointment.findFirst({
        where: { ...where, id: query.cursor },
        select: { id: true },
      });
      if (!cursor)
        throw new BadRequestException(
          'Appointment cursor is invalid for this query.',
        );
    }
    const rows = await this.prisma.db.appointment.findMany({
      where,
      include,
      orderBy: [{ status: 'asc' }, { startsAt: 'asc' }, { id: 'asc' }],
      take: query.pageSize + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    const hasNext = rows.length > query.pageSize;
    const pageRows = hasNext ? rows.slice(0, query.pageSize) : rows;
    return Object.freeze({
      items: Object.freeze(pageRows.map((row) => this.map(row))),
      nextCursor: hasNext ? pageRows.at(-1)!.id : null,
    });
  }
  async get(access: AppointmentAccess, id: string) {
    const row = await this.prisma.db.appointment.findFirst({
      where: { id, ...this.scope(access) },
      include,
    });
    return row ? this.map(row) : null;
  }
  async validateContext(
    access: AppointmentAccess,
    input: AppointmentWrite,
  ): Promise<void> {
    const [doctor, clinic, patient] = await Promise.all([
      this.prisma.db.doctor.findFirst({
        where: {
          id: input.doctorId,
          organizationId: input.organizationId,
          status: 'active',
          organization: { status: 'active' },
          clinicAssignments: { some: { clinicId: input.clinicId } },
        },
        select: { id: true },
      }),
      this.prisma.db.clinic.findFirst({
        where: {
          id: input.clinicId,
          organizationId: input.organizationId,
          status: 'active',
        },
        select: { id: true },
      }),
      this.prisma.db.organizationPatientProfile.findFirst({
        where: {
          organizationId: input.organizationId,
          patientProfileId: input.patientProfileId,
          patientProfile: {
            status: 'active',
            ...(access.patient
              ? { patientAccount: { userId: access.actorId } }
              : {}),
          },
        },
        select: { patientProfileId: true },
      }),
    ]);
    if (doctor && clinic && patient) return;
    if (access.patient)
      throw new ForbiddenException(
        'Appointment participants are unavailable or outside scope.',
      );
    if (!doctor)
      throw new BadRequestException(
        'Doctor is inactive or unavailable at this clinic.',
      );
    if (!clinic)
      throw new BadRequestException('Clinic is inactive or unavailable.');
    throw new BadRequestException(
      'Patient registration is inactive or unavailable.',
    );
  }
  async create(
    access: AppointmentAccess,
    input: AppointmentWrite,
    requestId: string,
    command: AppointmentCommand,
    validate: () => Promise<void>,
  ) {
    try {
      return await this.prisma.db.$transaction(async (tx) => {
        const replay = await this.beginCommand(tx, access, command);
        if (replay) return replay;
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${input.organizationId}:${input.doctorId}`}, 0))`;
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`patient:${input.organizationId}:${input.patientProfileId}`}, 0))`;
        await validate();
        const row = await tx.appointment.create({ data: input, include });
        await tx.appointmentArrival.create({
          data: {
            organizationId: row.organizationId,
            clinicId: row.clinicId,
            appointmentId: row.id,
            patientProfileId: row.patientProfileId,
          },
        });
        await this.events(tx, access, row, 'appointment.created', requestId);
        const result = this.map(row);
        await this.completeCommand(tx, access, command, result);
        return result;
      });
    } catch (error) {
      this.conflict(error);
      throw error;
    }
  }
  update(
    access: AppointmentAccess,
    id: string,
    reason: string,
    version: number,
    requestId: string,
    command: AppointmentCommand,
  ) {
    return this.mutate(
      access,
      id,
      version,
      requestId,
      command,
      'appointment.updated',
      {
        reason,
        version: { increment: 1 },
      },
    );
  }
  cancel(
    access: AppointmentAccess,
    id: string,
    reason: string,
    version: number,
    requestId: string,
    command: AppointmentCommand,
  ) {
    return this.mutate(
      access,
      id,
      version,
      requestId,
      command,
      'appointment.cancelled',
      {
        status: 'cancelled',
        cancellationReason: reason,
        cancelledAt: new Date(),
        version: { increment: 1 },
      },
    );
  }
  reschedule(
    access: AppointmentAccess,
    id: string,
    input: AppointmentWrite,
    version: number,
    requestId: string,
    command: AppointmentCommand,
    validate: () => Promise<void>,
  ) {
    return this.mutate(
      access,
      id,
      version,
      requestId,
      command,
      'appointment.rescheduled',
      {
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        durationMinutes: input.durationMinutes,
        clinicId: input.clinicId,
        doctorId: input.doctorId,
        version: { increment: 1 },
      },
      validate,
    );
  }
  async auditView(
    access: AppointmentAccess,
    appointments: readonly AppointmentProjection[],
    requestId: string,
  ) {
    if (access.patient || appointments.length === 0) return;
    const groups = new Map<string, AppointmentProjection[]>();
    for (const item of appointments)
      groups.set(`${item.organizationId}:${item.clinicId}`, [
        ...(groups.get(`${item.organizationId}:${item.clinicId}`) ?? []),
        item,
      ]);
    await this.prisma.db.$transaction(
      [...groups.values()].map((items) => {
        const first = items[0]!;
        return this.prisma.db.auditEvent.create({
          data: {
            actorUserId: access.actorId,
            organizationId: first.organizationId,
            clinicId: first.clinicId,
            action: 'appointment.page_viewed',
            targetType: 'Appointment',
            targetId: null,
            outcome: 'succeeded',
            requestId,
            occurredAt: new Date(),
            metadata: { count: items.length },
          },
        });
      }),
    );
  }
  private async mutate(
    access: AppointmentAccess,
    id: string,
    version: number,
    requestId: string,
    command: AppointmentCommand,
    action: string,
    data: Prisma.AppointmentUncheckedUpdateManyInput,
    validate?: () => Promise<void>,
  ) {
    try {
      return await this.prisma.db.$transaction(async (tx) => {
        const replay = await this.beginCommand(tx, access, command);
        if (replay) return replay;
        await tx.$queryRaw`SELECT "id" FROM "appointments"
          WHERE "id" = ${id}::uuid FOR UPDATE`;
        const current = await tx.appointment.findFirst({
          where: {
            id,
            ...this.scope(access),
            status: { in: ['scheduled', 'confirmed'] },
          },
        });
        if (!current)
          throw new NotFoundException(
            'Appointment was not found or is no longer mutable.',
          );
        if (action === 'appointment.cancelled') {
          const activeQueueEntry = await tx.queueEntry.findFirst({
            where: {
              appointmentId: id,
              status: { in: ['waiting', 'called', 'inConsultation'] },
            },
            select: { id: true },
          });
          if (activeQueueEntry)
            throw new ConflictException(
              'An appointment in an active queue cannot be cancelled.',
            );
        }
        if (validate) {
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${current.organizationId}:${current.doctorId}`}, 0))`;
          await validate();
        }
        const changed = await tx.appointment.updateMany({
          where: { id, version, status: { in: ['scheduled', 'confirmed'] } },
          data,
        });
        if (changed.count !== 1)
          throw new ConflictException('Appointment version is stale.');
        const row = await tx.appointment.findUniqueOrThrow({
          where: { id },
          include,
        });
        await this.events(tx, access, row, action, requestId);
        const result = this.map(row);
        await this.completeCommand(tx, access, command, result);
        return result;
      });
    } catch (error) {
      this.conflict(error);
      throw error;
    }
  }
  private scope(access: AppointmentAccess): Prisma.AppointmentWhereInput {
    if (access.patient)
      return {
        patientRegistration: {
          patientProfile: { patientAccount: { userId: access.actorId } },
        },
      };
    if (access.doctor)
      return {
        doctorAssignment: {
          doctor: { staffAccount: { userId: access.actorId } },
        },
      };
    if (access.platformAdministrator) return {};
    if (!access.organizationId || !access.clinicId)
      throw new ForbiddenException('Staff tenant context is required.');
    return { organizationId: access.organizationId, clinicId: access.clinicId };
  }
  private async events(
    tx: Prisma.TransactionClient,
    access: AppointmentAccess,
    row: Row,
    action: string,
    requestId: string,
  ) {
    try {
      await tx.appointmentEvent.create({
        data: {
          organizationId: row.organizationId,
          appointmentId: row.id,
          type: action,
          payload: {},
          occurredAt: new Date(),
        },
      });
      await tx.auditEvent.create({
        data: {
          actorUserId: access.actorId,
          organizationId: row.organizationId,
          clinicId: row.clinicId,
          action,
          targetType: 'Appointment',
          targetId: row.id,
          outcome: 'succeeded',
          requestId,
          occurredAt: new Date(),
        },
      });
    } catch {
      throw new AppointmentAuditPersistenceError();
    }
  }
  private map(row: Row): AppointmentProjection {
    return Object.freeze({
      id: row.id,
      reference: row.publicReference,
      organizationId: row.organizationId,
      clinicId: row.clinicId,
      clinicName: row.clinic.name,
      doctorId: row.doctorId,
      doctorName: row.doctorAssignment.doctor.displayName,
      patientProfileId: row.patientProfileId,
      patientName: `${row.patientRegistration.patientProfile.firstName} ${row.patientRegistration.patientProfile.lastName}`,
      type: row.type,
      reason: row.reason,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt.toISOString(),
      durationMinutes: row.durationMinutes,
      feeIqd: row.feeIqd,
      status: row.status,
      cancellationReason: row.cancellationReason,
      version: row.version,
    });
  }
  private conflict(error: unknown): void {
    const text = this.errorText(error);
    if (
      text.includes('appointments_doctor_no_overlap') ||
      text.includes('appointments_patient_no_overlap')
    )
      throw new ConflictException(
        'Appointment conflicts with an existing appointment.',
      );
  }
  private async beginCommand(
    tx: Prisma.TransactionClient,
    access: AppointmentAccess,
    command: AppointmentCommand,
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
        return existing.responseBody as unknown as AppointmentProjection;
      throw new ConflictException('The command is already in progress.');
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
    access: AppointmentAccess,
    command: AppointmentCommand,
    response: AppointmentProjection,
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
        responseCode: command.responseCode,
        responseBody: response as unknown as Prisma.InputJsonValue,
      },
    });
  }
  private errorText(error: unknown): string {
    if (error instanceof Error)
      return `${error.name} ${error.message} ${this.errorText((error as Error & { cause?: unknown }).cause)}`;
    return typeof error === 'string' ? error : '';
  }
}
