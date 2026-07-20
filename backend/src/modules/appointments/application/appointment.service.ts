import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
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
import {
  APPOINTMENT_REPOSITORY,
  type AppointmentRepository,
} from '../domain/appointment.repository';

export interface CreateAppointmentInput {
  organizationId: string;
  clinicId: string;
  doctorId: string;
  patientProfileId: string;
  type: AppointmentType;
  reason: string;
  startsAt: Date;
  durationMinutes: number;
  feeIqd: number;
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
  async list(access: AppointmentAccess, requestId: string) {
    const items = await this.repository.list(access);
    await this.audit(access, items, requestId);
    return items;
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
    requestId: string,
  ) {
    const write = this.write(access, input);
    await this.validate(access, write);
    return this.repository.create(access, write, requestId);
  }
  async update(
    access: AppointmentAccess,
    id: string,
    reason: string,
    version: number,
    requestId: string,
  ) {
    this.reason(reason);
    const item = await this.repository.update(
      access,
      id,
      reason.trim(),
      version,
      requestId,
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
    requestId: string,
  ) {
    this.reason(reason);
    const item = await this.repository.cancel(
      access,
      id,
      reason.trim(),
      version,
      requestId,
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
    requestId: string,
  ) {
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
      feeIqd: current.feeIqd,
    });
    await this.validate(access, write);
    const item = await this.repository.reschedule(
      access,
      id,
      write,
      version,
      requestId,
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
    if (!Number.isInteger(input.feeIqd) || input.feeIqd < 0)
      throw new BadRequestException('Appointment fee is invalid.');
    this.reason(input.reason);
    if (
      !access.patient &&
      !access.platformAdministrator &&
      (input.organizationId !== access.organizationId ||
        input.clinicId !== access.clinicId)
    )
      throw new BadRequestException(
        'Appointment tenant does not match authenticated clinic.',
      );
    return Object.freeze({
      ...input,
      reason: input.reason.trim(),
      endsAt: new Date(
        input.startsAt.getTime() + input.durationMinutes * 60_000,
      ),
    });
  }
  private async validate(access: AppointmentAccess, input: AppointmentWrite) {
    const tolerance =
      this.configuration.appointmentPastToleranceMinutes * 60_000;
    if (
      !Number.isFinite(input.startsAt.getTime()) ||
      input.startsAt.getTime() < Date.now() - tolerance
    )
      throw new BadRequestException(
        'Appointment cannot be booked in the past.',
      );
    await this.repository.validateContext(access, input);
    await this.schedules.assertBookable(
      this.doctorAccess(access),
      input.doctorId,
      input.clinicId,
      input.startsAt,
      input.endsAt,
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
}
