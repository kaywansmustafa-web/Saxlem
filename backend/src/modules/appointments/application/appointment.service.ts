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
import { TimezoneService } from '../../doctors/application/timezone.service';
import type { DoctorAccessContext } from '../../doctors/application/doctor.service';
import type {
  AppointmentAccess,
  AppointmentProjection,
  AppointmentType,
  AppointmentWrite,
  BookingDayProjection,
  BookingOptionsProjection,
  DayBoardAppointment,
  DayBoardDoctor,
  DayBoardProjection,
  DayBoardSlot,
  DayBoardSlotState,
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
  /** Staff only: the patient is standing at the desk without a booking. */
  walkIn?: boolean;
}
@Injectable()
export class AppointmentService {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly repository: AppointmentRepository,
    private readonly schedules: DoctorScheduleService,
    private readonly timezones: TimezoneService,
    @Inject(BACKEND_CONFIGURATION)
    private readonly configuration: BackendConfiguration,
  ) {}

  /** A receptionist's doctors, or null when the caller isn't scoped. */
  private receptionScope(access: AppointmentAccess): readonly string[] | null {
    return access.doctorIds?.length ? access.doctorIds : null;
  }

  private requireOwnDoctor(access: AppointmentAccess, doctorId: string) {
    const scope = this.receptionScope(access);
    if (scope && !scope.includes(doctorId))
      throw new ForbiddenException(
        "This doctor isn't on your list. Add them under My doctors first.",
      );
  }
  async bookingOptions(
    access: AppointmentAccess,
    doctorId: string,
    clinicId: string,
    patientProfileId: string,
    appointmentType: AppointmentType,
    dateFrom: string,
    dateTo: string,
    requestId: string,
  ): Promise<BookingOptionsProjection> {
    const staff =
      !access.patient &&
      !access.platformAdministrator &&
      !!access.organizationId &&
      access.clinicId === clinicId;
    if (!access.patient && !staff)
      throw new ForbiddenException(
        'Booking options are limited to patients and staff of this clinic.',
      );
    this.dateWindow(dateFrom, dateTo);
    if (staff) this.requireOwnDoctor(access, doctorId);
    const generatedAt = new Date();
    // Reception may still book the slot that has just begun (a walk-in at
    // 10:03 takes the 10:00 slot); the app only offers slots in the future.
    const earliestStart = staff
      ? new Date(
          generatedAt.getTime() -
            this.configuration.appointmentPastToleranceMinutes * 60_000,
        )
      : generatedAt;
    const scheduleAt = new Date(`${dateFrom}T12:00:00.000Z`);
    const schedule = await this.schedules.schedule(
      this.doctorAccess(access),
      doctorId,
      clinicId,
      requestId,
      scheduleAt,
    );
    const clinic = schedule.clinics.find((item) => item.clinicId === clinicId);
    if (!clinic) throw new NotFoundException('Booking options were not found.');
    const durationMinutes =
      this.configuration.appointmentFoundationDurationMinutes;
    const rangeStart = this.timezones.instantForLocalDateMinute(
      dateFrom,
      0,
      clinic.timezone.identifier,
    );
    const afterEnd = this.timezones.instantForLocalDateMinute(
      this.addDate(dateTo, 1),
      0,
      clinic.timezone.identifier,
    );
    if (!rangeStart || !afterEnd)
      throw new BadRequestException('Booking date window is invalid.');
    await this.repository.validateContext(access, {
      organizationId: schedule.organizationId,
      clinicId,
      doctorId,
      patientProfileId,
      type: appointmentType,
      origin: 'patientBooked',
      reason: 'Booking availability validation',
      startsAt: rangeStart,
      endsAt: new Date(rangeStart.getTime() + durationMinutes * 60_000),
      durationMinutes,
      feeIqd: this.configuration.appointmentFoundationFeeIqd,
    });
    const conflicts = await this.repository.findBookingConflicts({
      organizationId: schedule.organizationId,
      doctorId,
      patientProfileId,
      startsAt: rangeStart,
      endsAt: afterEnd,
    });
    const days: BookingDayProjection[] = [];
    for (let date = dateFrom; date <= dateTo; date = this.addDate(date, 1)) {
      const slots = this.gridSlots(clinic, date, durationMinutes)
        .filter(
          ({ start, end, allowed }) =>
            allowed &&
            start > earliestStart &&
            !conflicts.some(
              (item) =>
                new Date(item.startsAt) < end && new Date(item.endsAt) > start,
            ),
        )
        .map(({ start, end }) =>
          Object.freeze({
            startsAt: start.toISOString(),
            endsAt: end.toISOString(),
            durationMinutes,
          }),
        );
      days.push(Object.freeze({ date, slots: Object.freeze(slots) }));
    }
    return Object.freeze({
      doctorId: schedule.doctorId,
      doctorName: schedule.doctorName,
      organizationId: schedule.organizationId,
      clinicId: clinic.clinicId,
      clinicName: clinic.clinicName,
      clinicTimezone: clinic.timezone.identifier,
      appointmentType,
      durationMinutes,
      feeIqd: this.configuration.appointmentFoundationFeeIqd,
      currency: 'IQD',
      dateFrom,
      dateTo,
      days: Object.freeze(days),
      generatedAt: generatedAt.toISOString(),
    });
  }
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
    const scope = this.receptionScope(access);
    const page = await this.repository.list(
      access,
      scope ? { ...query, doctorIds: scope } : query,
    );
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
    if (!access.patient) this.requireOwnDoctor(access, input.doctorId);
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
    if (
      access.patient &&
      input.durationMinutes !==
        this.configuration.appointmentFoundationDurationMinutes
    )
      throw new BadRequestException(
        'Appointment duration does not match booking configuration.',
      );
    this.reason(input.reason);
    if (input.walkIn) {
      if (access.patient || access.platformAdministrator)
        throw new ForbiddenException('Only clinic staff can record walk-ins.');
      const lead = input.startsAt.getTime() - Date.now();
      if (lead > 60 * 60_000)
        throw new BadRequestException(
          'A walk-in must start within the next hour; book it as an appointment instead.',
        );
    }
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
      origin: access.patient
        ? 'patientBooked'
        : input.walkIn
          ? 'walkIn'
          : 'clinicCreated',
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
  private dateWindow(dateFrom: string, dateTo: string) {
    const valid = (value: string) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const parsed = new Date(`${value}T00:00:00.000Z`);
      return (
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().startsWith(value)
      );
    };
    if (!valid(dateFrom) || !valid(dateTo) || dateTo < dateFrom)
      throw new BadRequestException('Booking date window is invalid.');
    const days =
      (new Date(`${dateTo}T00:00:00.000Z`).getTime() -
        new Date(`${dateFrom}T00:00:00.000Z`).getTime()) /
        86_400_000 +
      1;
    if (days > 31)
      throw new BadRequestException(
        'Booking date window must not exceed 31 days.',
      );
  }
  private addDate(value: string, days: number) {
    const date = new Date(`${value}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }
  /**
   * Every slot of the doctor's working periods on one clinic-local date, in
   * order, marked whether breaks, leave and holidays allow it. The app's
   * booking options and reception's day board both build on this.
   */
  private gridSlots(
    clinic: Awaited<
      ReturnType<DoctorScheduleService['schedule']>
    >['clinics'][number],
    date: string,
    durationMinutes: number,
  ): { start: Date; end: Date; allowed: boolean }[] {
    const zone = clinic.timezone.identifier;
    const noon = this.timezones.instantForLocalDateMinute(date, 12 * 60, zone);
    const weekday = noon ? this.timezones.localClock(noon, zone).weekday : 0;
    const periods: { startsMinute: number; endsMinute: number }[] = [
      ...clinic.weeklySchedule.filter((item) => item.weekday === weekday),
    ];
    for (const exception of clinic.exceptions.filter(
      (item) => item.kind === 'working',
    )) {
      const startClock = this.timezones.localClock(
        new Date(exception.startsAt),
        zone,
      );
      const endClock = this.timezones.localClock(
        new Date(new Date(exception.endsAt).getTime() - 1),
        zone,
      );
      if (startClock.date === date && endClock.date === date)
        periods.push({
          startsMinute: startClock.minuteOfDay,
          endsMinute: endClock.minuteOfDay + 1,
        });
    }
    const slots: { start: Date; end: Date; allowed: boolean }[] = [];
    const seen = new Set<string>();
    for (const period of periods.sort(
      (left, right) => left.startsMinute - right.startsMinute,
    )) {
      for (
        let minute = period.startsMinute;
        minute + durationMinutes <= period.endsMinute;
        minute += durationMinutes
      ) {
        const start = this.timezones.instantForLocalDateMinute(
          date,
          minute,
          zone,
        );
        if (!start) continue;
        const end = new Date(start.getTime() + durationMinutes * 60_000);
        const key = start.toISOString();
        if (seen.has(key)) continue;
        seen.add(key);
        slots.push({
          start,
          end,
          allowed: this.scheduleAllows(clinic, weekday, minute, start, end),
        });
      }
    }
    return slots.sort((left, right) => +left.start - +right.start);
  }

  /**
   * Reception's day board: every doctor at the signed-in clinic, with each
   * slot marked free, booked (and how: app, phone or walk-in), unavailable
   * (break, leave, holiday) or past. Uses the same schedule and conflict
   * rules as booking, so a slot shown free is one that can be booked.
   */
  async dayBoard(
    access: AppointmentAccess,
    date: string,
    requestId: string,
  ): Promise<DayBoardProjection> {
    if (
      access.patient ||
      access.platformAdministrator ||
      !access.organizationId ||
      !access.clinicId
    )
      throw new ForbiddenException('Staff tenant context is required.');
    this.dateWindow(date, date);
    const organizationId = access.organizationId;
    const clinicId = access.clinicId;
    const generatedAt = new Date();
    const durationMinutes =
      this.configuration.appointmentFoundationDurationMinutes;
    const earliestStart = new Date(
      generatedAt.getTime() -
        this.configuration.appointmentPastToleranceMinutes * 60_000,
    );
    const scope = this.receptionScope(access);
    const doctors = (
      await this.repository.clinicDoctors(organizationId, clinicId)
    ).filter((doctor) => !scope || scope.includes(doctor.id));
    const schedules = await Promise.all(
      doctors.map((doctor) =>
        this.schedules
          .schedule(
            this.doctorAccess(access),
            doctor.id,
            clinicId,
            requestId,
            new Date(`${date}T12:00:00.000Z`),
          )
          .then((schedule) =>
            schedule.clinics.find((item) => item.clinicId === clinicId),
          )
          .catch(() => undefined),
      ),
    );
    const timezone =
      schedules.find(Boolean)?.timezone.identifier ?? 'Asia/Baghdad';
    const dayStart = this.timezones.instantForLocalDateMinute(
      date,
      0,
      timezone,
    );
    const dayEnd = this.timezones.instantForLocalDateMinute(
      this.addDate(date, 1),
      0,
      timezone,
    );
    if (!dayStart || !dayEnd)
      throw new BadRequestException('Board date is invalid.');
    const appointments = await this.repository.dayAppointments(
      organizationId,
      clinicId,
      dayStart,
      dayEnd,
    );
    const summary = (item: AppointmentProjection): DayBoardAppointment =>
      Object.freeze({
        id: item.id,
        reference: item.reference,
        origin: item.origin,
        status: item.status,
        patientName: item.patientName,
      });
    const board = doctors.map((doctor, index): DayBoardDoctor => {
      const clinic = schedules[index];
      const own = appointments.filter((item) => item.doctorId === doctor.id);
      const placed = new Set<string>();
      const slots: DayBoardSlot[] = (
        clinic ? this.gridSlots(clinic, date, durationMinutes) : []
      ).map(({ start, end, allowed }) => {
        const booked = own.find(
          (item) =>
            new Date(item.startsAt) < end && new Date(item.endsAt) > start,
        );
        if (booked) placed.add(booked.id);
        const state: DayBoardSlotState = booked
          ? 'booked'
          : !allowed
            ? 'unavailable'
            : start <= earliestStart
              ? 'past'
              : 'free';
        return Object.freeze({
          startsAt: start.toISOString(),
          endsAt: end.toISOString(),
          state,
          walkIn:
            state === 'free' &&
            start.getTime() - generatedAt.getTime() <= 60 * 60_000,
          appointment: booked ? summary(booked) : null,
        });
      });
      // Bookings outside the normal grid (moved by hand, or after hours)
      // still appear, so the board never hides a patient.
      for (const item of own.filter((entry) => !placed.has(entry.id)))
        slots.push(
          Object.freeze({
            startsAt: item.startsAt,
            endsAt: item.endsAt,
            state: 'booked',
            walkIn: false,
            appointment: summary(item),
          }),
        );
      slots.sort((left, right) => left.startsAt.localeCompare(right.startsAt));
      return Object.freeze({
        doctorId: doctor.id,
        doctorName: doctor.displayName,
        slots: Object.freeze(slots),
      });
    });
    await this.audit(access, appointments, requestId);
    return Object.freeze({
      date,
      clinicId,
      clinicTimezone: timezone,
      durationMinutes,
      generatedAt: generatedAt.toISOString(),
      doctors: Object.freeze(board),
    });
  }

  private scheduleAllows(
    clinic: Awaited<
      ReturnType<DoctorScheduleService['schedule']>
    >['clinics'][number],
    weekday: number,
    minute: number,
    startsAt: Date,
    endsAt: Date,
  ) {
    const overlaps = (period: { startsAt: string; endsAt: string }) =>
      new Date(period.startsAt) < endsAt && new Date(period.endsAt) > startsAt;
    const exception = clinic.exceptions.find(overlaps);
    if (exception)
      return (
        exception.kind === 'working' &&
        new Date(exception.startsAt) <= startsAt &&
        new Date(exception.endsAt) >= endsAt
      );
    if (clinic.leave.some(overlaps) || clinic.holidays.some(overlaps))
      return false;
    return !clinic.breaks.some(
      (period) =>
        period.weekday === weekday &&
        period.startsMinute <
          minute + this.configuration.appointmentFoundationDurationMinutes &&
        period.endsMinute > minute,
    );
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
