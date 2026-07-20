import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { BACKEND_CONFIGURATION } from '../../../config/configuration.module';
import type { BackendConfiguration } from '../../../config/environment';
import { DoctorScheduleService } from '../../doctors/application/doctor-schedule.service';
import type { DoctorAccessContext } from '../../doctors/application/doctor.service';
import type {
  AppointmentAccess,
  AppointmentProjection,
  AppointmentType,
  AppointmentWrite,
} from '../domain/appointment';
import { AppointmentAuditPersistenceError } from '../domain/appointment.errors';
import {
  APPOINTMENT_REPOSITORY,
  type AppointmentRepository,
  type AppointmentListQuery,
} from '../domain/appointment.repository';

export interface CreateAppointmentInput {
  organizationId: string;
  clinicId: string;
  doctorId: string;
  patientProfileId: string;
  type: AppointmentType;
  reason: string;
  startsAt: Date;
  startsAtSource?: string;
  durationMinutes: number;
}
@Injectable()
export class AppointmentService {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly repository: AppointmentRepository,
    private readonly schedules: DoctorScheduleService,
    @Inject(BACKEND_CONFIGURATION)
    private readonly configuration: BackendConfiguration,
  ) {}
  async list(
    access: AppointmentAccess,
    query: AppointmentListQuery,
    requestId: string,
  ) {
    if (
      !Number.isFinite(query.from.getTime()) ||
      !Number.isFinite(query.to.getTime()) ||
      query.to <= query.from ||
      query.to.getTime() - query.from.getTime() > 366 * 86_400_000
    )
      throw new BadRequestException(
        'Appointment date window must be positive and no longer than 366 days.',
      );
    if (
      !Number.isInteger(query.pageSize) ||
      query.pageSize < 1 ||
      query.pageSize > 50
    )
      throw new BadRequestException(
        'Appointment page size must be between 1 and 50.',
      );
    const page = await this.repository.list(access, query);
    await this.audit(access, page.items, requestId);
    return page;
  }
  async get(access: AppointmentAccess, id: string, requestId: string) {
    const item = await this.repository.get(access, id);
    if (!item) throw new NotFoundException('Appointment was not found.');
    await this.audit(access, [item], requestId);
    return item;
  }
  async create(
    access: AppointmentAccess,
    input: CreateAppointmentInput,
    idempotencyKey: string,
    requestId: string,
  ) {
    const command = this.command(
      idempotencyKey,
      'appointment.create',
      input,
      201,
    );
    const replay = await this.commandResult(() =>
      this.repository.replay(access, command),
    );
    if (replay) return replay;
    const write = this.write(access, input);
    this.validateTime(write);
    return this.commandResult(() =>
      this.repository.create(access, write, requestId, command, () =>
        this.validateContext(access, write, input.startsAtSource),
      ),
    );
  }
  async update(
    access: AppointmentAccess,
    id: string,
    reason: string,
    version: number,
    idempotencyKey: string,
    requestId: string,
  ) {
    const normalizedReason = reason?.trim() ?? '';
    const command = this.command(
      idempotencyKey,
      `appointment.update:${id}`,
      { id, reason: normalizedReason, version },
      200,
    );
    const replay = await this.commandResult(() =>
      this.repository.replay(access, command),
    );
    if (replay) return replay;
    this.reason(reason);
    const item = await this.commandResult(() =>
      this.repository.update(
        access,
        id,
        normalizedReason,
        version,
        requestId,
        command,
      ),
    );
    if (!item)
      throw new NotFoundException(
        'Appointment was not found or is no longer editable.',
      );
    return item;
  }
  async cancel(
    access: AppointmentAccess,
    id: string,
    reason: string,
    version: number,
    idempotencyKey: string,
    requestId: string,
  ) {
    const normalizedReason = reason?.trim() ?? '';
    const command = this.command(
      idempotencyKey,
      `appointment.cancel:${id}`,
      { id, reason: normalizedReason, version },
      200,
    );
    const replay = await this.commandResult(() =>
      this.repository.replay(access, command),
    );
    if (replay) return replay;
    this.reason(reason);
    const item = await this.commandResult(() =>
      this.repository.cancel(
        access,
        id,
        normalizedReason,
        version,
        requestId,
        command,
      ),
    );
    if (!item)
      throw new NotFoundException(
        'Appointment was not found or is no longer cancellable.',
      );
    return item;
  }
  async reschedule(
    access: AppointmentAccess,
    id: string,
    startsAt: Date,
    durationMinutes: number,
    version: number,
    idempotencyKey: string,
    requestId: string,
    startsAtSource?: string,
  ) {
    if (!Number.isFinite(startsAt.getTime()))
      throw new BadRequestException('Appointment start time is invalid.');
    const command = this.command(
      idempotencyKey,
      `appointment.reschedule:${id}`,
      { id, startsAt: startsAt.toISOString(), durationMinutes, version },
      200,
    );
    const replay = await this.commandResult(() =>
      this.repository.replay(access, command),
    );
    if (replay) return replay;
    const current = await this.repository.get(access, id);
    if (!current) throw new NotFoundException('Appointment was not found.');
    const write = this.write(access, {
      organizationId: current.organizationId,
      clinicId: current.clinicId,
      doctorId: current.doctorId,
      patientProfileId: current.patientProfileId,
      type: current.type,
      reason: current.reason,
      startsAt,
      durationMinutes,
    });
    this.validateTime(write);
    const item = await this.commandResult(() =>
      this.repository.reschedule(
        access,
        id,
        write,
        version,
        requestId,
        command,
        () => this.validateContext(access, write, startsAtSource),
      ),
    );
    if (!item) throw new ConflictException('Appointment version is stale.');
    return item;
  }
  private write(
    access: AppointmentAccess,
    input: CreateAppointmentInput,
  ): AppointmentWrite {
    if (
      !Number.isInteger(input.durationMinutes) ||
      input.durationMinutes < 5 ||
      input.durationMinutes > 480
    )
      throw new BadRequestException(
        'Appointment duration must be between 5 and 480 minutes.',
      );
    this.reason(input.reason);
    if (
      !access.patient &&
      !access.platformAdministrator &&
      (input.organizationId !== access.organizationId ||
        input.clinicId !== access.clinicId)
    )
      throw new ForbiddenException(
        'Appointment tenant does not match authenticated clinic.',
      );
    return Object.freeze({
      organizationId: input.organizationId,
      clinicId: input.clinicId,
      doctorId: input.doctorId,
      patientProfileId: input.patientProfileId,
      type: input.type,
      reason: input.reason.trim(),
      startsAt: input.startsAt,
      durationMinutes: input.durationMinutes,
      feeIqd: this.configuration.appointmentFoundationFeeIqd,
      endsAt: new Date(
        input.startsAt.getTime() + input.durationMinutes * 60_000,
      ),
    });
  }
  private command(
    key: string,
    scope: string,
    body: object,
    responseCode: 200 | 201,
  ) {
    if (!/^[\x21-\x7E]{8,128}$/.test(key))
      throw new BadRequestException(
        'A valid Idempotency-Key header is required.',
      );
    return Object.freeze({
      key,
      scope,
      hash: createHash('sha256').update(JSON.stringify(body)).digest('hex'),
      responseCode,
    });
  }
  private validateTime(input: AppointmentWrite) {
    const tolerance =
      this.configuration.appointmentPastToleranceMinutes * 60_000;
    if (
      !Number.isFinite(input.startsAt.getTime()) ||
      input.startsAt.getTime() < Date.now() - tolerance
    )
      throw new BadRequestException(
        'Appointment cannot be booked in the past.',
      );
  }
  private async validateContext(
    access: AppointmentAccess,
    input: AppointmentWrite,
    startsAtSource?: string,
  ) {
    await this.repository.validateContext(access, input);
    await this.schedules.assertBookable(
      this.doctorAccess(access),
      input.doctorId,
      input.clinicId,
      input.startsAt,
      input.endsAt,
      startsAtSource,
    );
  }
  private doctorAccess(access: AppointmentAccess): DoctorAccessContext {
    return { ...access };
  }
  private reason(value: string) {
    if (!value?.trim() || value.trim().length > 500)
      throw new BadRequestException(
        'Appointment reason must contain 1 to 500 characters.',
      );
  }
  private async audit(
    access: AppointmentAccess,
    items: readonly AppointmentProjection[],
    requestId: string,
  ) {
    try {
      await this.repository.auditView(access, items, requestId);
    } catch {
      throw new ServiceUnavailableException(
        'Security audit is temporarily unavailable.',
      );
    }
  }
  private async commandResult<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof AppointmentAuditPersistenceError)
        throw new ServiceUnavailableException(
          'Security audit is temporarily unavailable.',
        );
      throw error;
    }
  }
}
