import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type {
  AppointmentAccess,
  AppointmentProjection,
  AppointmentWrite,
} from '../domain/appointment';
import type { AppointmentRepository } from '../domain/appointment.repository';

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

  async list(access: AppointmentAccess) {
    const rows = await this.prisma.db.appointment.findMany({
      where: this.scope(access),
      include,
      orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
    });
    return Object.freeze(rows.map((row) => this.map(row)));
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
    const doctor = await this.prisma.db.doctor.findFirst({
      where: {
        id: input.doctorId,
        organizationId: input.organizationId,
        status: 'active',
        organization: { status: 'active' },
        clinicAssignments: {
          some: { clinicId: input.clinicId, clinic: { status: 'active' } },
        },
      },
      select: { id: true },
    });
    const patient = await this.prisma.db.organizationPatientProfile.findFirst({
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
    });
    if (!doctor || !patient)
      throw new ForbiddenException(
        'Appointment participants are unavailable or outside scope.',
      );
  }
  async create(
    access: AppointmentAccess,
    input: AppointmentWrite,
    requestId: string,
  ) {
    try {
      return await this.prisma.db.$transaction(async (tx) => {
        const row = await tx.appointment.create({ data: input, include });
        await this.events(tx, access, row, 'appointment.created', requestId);
        return this.map(row);
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
  ) {
    return this.mutate(access, id, version, requestId, 'appointment.updated', {
      reason,
      version: { increment: 1 },
    });
  }
  cancel(
    access: AppointmentAccess,
    id: string,
    reason: string,
    version: number,
    requestId: string,
  ) {
    return this.mutate(
      access,
      id,
      version,
      requestId,
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
  ) {
    return this.mutate(
      access,
      id,
      version,
      requestId,
      'appointment.rescheduled',
      {
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        durationMinutes: input.durationMinutes,
        clinicId: input.clinicId,
        doctorId: input.doctorId,
        version: { increment: 1 },
      },
    );
  }
  async auditView(
    access: AppointmentAccess,
    appointments: readonly AppointmentProjection[],
    requestId: string,
  ) {
    if (access.patient || appointments.length === 0) return;
    await this.prisma.db.$transaction(
      appointments.map((item) =>
        this.prisma.db.auditEvent.create({
          data: {
            actorUserId: access.actorId,
            organizationId: item.organizationId,
            clinicId: item.clinicId,
            action: 'appointment.viewed',
            targetType: 'Appointment',
            targetId: item.id,
            outcome: 'succeeded',
            requestId,
            occurredAt: new Date(),
          },
        }),
      ),
    );
  }
  private async mutate(
    access: AppointmentAccess,
    id: string,
    version: number,
    requestId: string,
    action: string,
    data: Prisma.AppointmentUncheckedUpdateManyInput,
  ) {
    try {
      return await this.prisma.db.$transaction(async (tx) => {
        const current = await tx.appointment.findFirst({
          where: {
            id,
            ...this.scope(access),
            status: { in: ['scheduled', 'confirmed'] },
          },
        });
        if (!current) return null;
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
        return this.map(row);
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
    if (typeof error === 'object' && error && 'code' in error)
      throw new ConflictException(
        'Appointment conflicts with an existing appointment.',
      );
  }
}
