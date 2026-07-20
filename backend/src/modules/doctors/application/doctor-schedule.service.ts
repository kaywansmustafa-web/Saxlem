import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { DoctorAccessContext } from './doctor.service';
import type {
  AvailabilityProjection,
  ClinicAvailabilityProjection,
  ClinicHoursProjection,
  ClinicScheduleProjection,
  DoctorScheduleProjection,
  EffectiveWorkingPeriodProjection,
  RecurringPeriodProjection,
} from '../domain/doctor-schedule';
import {
  DOCTOR_SCHEDULE_REPOSITORY,
  type DoctorScheduleRepository,
  type ScheduleReadScope,
} from '../domain/doctor-schedule.repository';
import { TimezoneService } from './timezone.service';

@Injectable()
export class DoctorScheduleService {
  constructor(
    @Inject(DOCTOR_SCHEDULE_REPOSITORY)
    private readonly repository: DoctorScheduleRepository,
    private readonly timezones: TimezoneService,
  ) {}

  async schedule(
    access: DoctorAccessContext,
    doctorId: string,
    requestedClinicId: string | undefined,
    requestId: string,
    at = new Date(),
  ): Promise<DoctorScheduleProjection> {
    const scope = this.scope(access, requestedClinicId, true);
    const projection = await this.repository.findDoctorSchedule(
      doctorId,
      scope,
      this.window(at),
    );
    if (!projection)
      throw new NotFoundException('Doctor schedule was not found.');
    await this.audit(access, projection, requestId, 'schedule.viewed');
    return projection;
  }

  async availability(
    access: DoctorAccessContext,
    doctorId: string,
    requestedClinicId: string | undefined,
    at: Date,
    requestId: string,
  ): Promise<AvailabilityProjection> {
    const scope = this.scope(access, requestedClinicId, false);
    const schedule = await this.repository.findDoctorSchedule(
      doctorId,
      scope,
      this.window(at),
    );
    if (!schedule)
      throw new NotFoundException('Doctor availability was not found.');
    await this.audit(access, schedule, requestId, 'availability.viewed');
    return Object.freeze({
      doctorId: schedule.doctorId,
      evaluatedAt: at.toISOString(),
      clinics: Object.freeze(
        schedule.clinics.map((clinic) => this.evaluate(clinic, at)),
      ),
    });
  }

  async clinicHours(
    access: DoctorAccessContext,
    clinicId: string,
    requestId: string,
  ): Promise<ClinicHoursProjection> {
    const scope = this.scope(access, clinicId, false);
    const hours = await this.repository.findClinicHours(clinicId, scope);
    if (!hours)
      throw new NotFoundException('Clinic working hours were not found.');
    if (!access.patient)
      await this.recordAudit(access, {
        organizationId: hours.organizationId,
        clinicId: hours.clinicId,
        targetType: 'Clinic',
        targetId: hours.clinicId,
        requestId,
        action: 'schedule.viewed',
      });
    return hours;
  }

  private scope(
    access: DoctorAccessContext,
    requestedClinicId?: string,
    ownDoctorOnly = false,
  ): ScheduleReadScope {
    if (!access.patient && !access.platformAdministrator) {
      if (!access.organizationId || !access.clinicId)
        throw new ForbiddenException('Staff tenant context is required.');
      if (requestedClinicId && requestedClinicId !== access.clinicId)
        throw new ForbiddenException(
          'Clinic does not match the authenticated tenant.',
        );
      return {
        organizationId: access.organizationId,
        clinicId: access.clinicId,
        ...(access.doctor && ownDoctorOnly
          ? { doctorActorId: access.actorId }
          : {}),
      };
    }
    return { clinicId: requestedClinicId };
  }

  private evaluate(
    clinic: ClinicScheduleProjection,
    at: Date,
  ): ClinicAvailabilityProjection {
    const clock = this.timezones.localClock(at, clinic.timezone.identifier);
    const activeAt = (period: { startsAt: string; endsAt: string }) =>
      new Date(period.startsAt) <= at && at < new Date(period.endsAt);
    const exception = clinic.exceptions.find(activeAt);
    const leave = clinic.leave.find(activeAt);
    const holiday = clinic.holidays.find(activeAt);
    const weekly = clinic.weeklySchedule.filter(
      (period) => period.weekday === clock.weekday,
    );
    const breaks = clinic.breaks.filter(
      (period) => period.weekday === clock.weekday,
    );
    let status: ClinicAvailabilityProjection['status'];
    let source: ClinicAvailabilityProjection['precedenceSource'];
    let recurringPeriods: readonly RecurringPeriodProjection[] = weekly;
    let effectivePeriods: readonly EffectiveWorkingPeriodProjection[] =
      weekly.map((period) => this.effectiveRecurring(period));
    if (exception) {
      status = exception.kind === 'working' ? 'workingToday' : 'unavailable';
      source = 'exception';
      recurringPeriods = [];
      effectivePeriods =
        exception.kind === 'working'
          ? [
              Object.freeze({
                source: 'exception',
                timeBasis: 'UTC',
                weekday: null,
                startsAt: exception.startsAt,
                endsAt: exception.endsAt,
              }),
            ]
          : [];
    } else if (leave) {
      status = 'onLeave';
      source = 'leave';
    } else if (holiday) {
      status = 'holiday';
      source = 'holiday';
    } else if (weekly.length) {
      status = 'workingToday';
      source = 'weeklySchedule';
    } else {
      status = 'closedToday';
      source = 'none';
    }
    const inPeriod = (period: RecurringPeriodProjection) =>
      period.startsMinute <= clock.minuteOfDay &&
      clock.minuteOfDay < period.endsMinute;
    const inBreak = !exception && breaks.some(inPeriod);
    const exceptionWorkingNow =
      exception?.kind === 'working' && activeAt(exception);
    const isWorkingNow =
      status === 'workingToday' &&
      !inBreak &&
      (exception ? exceptionWorkingNow : recurringPeriods.some(inPeriod));
    return Object.freeze({
      clinicId: clinic.clinicId,
      clinicName: clinic.clinicName,
      timezone: clinic.timezone.identifier,
      localDate: clock.date,
      status,
      isWorkingNow,
      workingPeriods: Object.freeze([...effectivePeriods]),
      breakPeriods: Object.freeze(exception ? [] : [...breaks]),
      holidayName: source === 'holiday' ? (holiday?.name ?? null) : null,
      precedenceSource: source,
    });
  }

  private async audit(
    access: DoctorAccessContext,
    schedule: DoctorScheduleProjection,
    requestId: string,
    action: 'schedule.viewed' | 'availability.viewed',
  ): Promise<void> {
    if (access.patient) return;
    await this.recordAudits(
      access,
      schedule.clinics.map((clinic) => ({
        organizationId: schedule.organizationId,
        clinicId: clinic.clinicId,
        targetType: 'Doctor' as const,
        targetId: schedule.doctorId,
        requestId,
        action,
      })),
    );
  }

  private async recordAudit(
    access: DoctorAccessContext,
    input: Omit<
      Parameters<DoctorScheduleRepository['recordReads']>[0][number],
      'actorId'
    >,
  ): Promise<void> {
    try {
      await this.repository.recordReads([
        { actorId: access.actorId, ...input },
      ]);
    } catch {
      throw new ServiceUnavailableException(
        'Security audit is temporarily unavailable.',
      );
    }
  }

  private async recordAudits(
    access: DoctorAccessContext,
    inputs: readonly Omit<
      Parameters<DoctorScheduleRepository['recordReads']>[0][number],
      'actorId'
    >[],
  ): Promise<void> {
    try {
      await this.repository.recordReads(
        inputs.map((input) => ({ actorId: access.actorId, ...input })),
      );
    } catch {
      throw new ServiceUnavailableException(
        'Security audit is temporarily unavailable.',
      );
    }
  }

  private effectiveRecurring(
    period: RecurringPeriodProjection,
  ): EffectiveWorkingPeriodProjection {
    return Object.freeze({
      source: 'weeklySchedule',
      timeBasis: 'clinicLocalWallClock',
      weekday: period.weekday,
      startsAt: this.clock(period.startsMinute),
      endsAt: this.clock(period.endsMinute),
    });
  }

  private clock(minutes: number): string {
    return `${Math.floor(minutes / 60)
      .toString()
      .padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`;
  }

  private window(at: Date) {
    const year = 366 * 24 * 60 * 60 * 1000;
    return Object.freeze({
      startsAt: new Date(at.getTime() - year),
      endsAt: new Date(at.getTime() + year),
    });
  }
}
