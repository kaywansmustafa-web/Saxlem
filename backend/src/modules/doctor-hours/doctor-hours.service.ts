import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AppSettings } from '../app-config/app-settings.service';
import { AppointmentService } from '../appointments/application/appointment.service';
import { checkWeek, strayBreaks, type WeeklyPeriod } from './hours-rules';

type Tx = Prisma.TransactionClient;
const DAY_MS = 86_400_000;

/**
 * A doctor's working hours, breaks, days off, visit length and app booking
 * switches, set by the owner (Owner Portal → doctor → Hours). Booking, the
 * reception day board and the next free time all read these.
 */
@Injectable()
export class DoctorHoursService {
  private readonly logger = new Logger(DoctorHoursService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: AppSettings,
    private readonly appointments: AppointmentService,
  ) {}

  async hours(doctorId: string, now = new Date()) {
    const doctor = await this.prisma.db.doctor.findUnique({
      where: { id: doctorId },
      select: {
        id: true,
        displayName: true,
        visitMinutes: true,
        availability: true,
        clinicAssignments: {
          where: { status: 'active' },
          select: {
            clinic: {
              select: {
                id: true,
                name: true,
                timezone: true,
                status: true,
                workingHours: {
                  where: { status: 'active' },
                  orderBy: [{ weekday: 'asc' }, { opensMinute: 'asc' }],
                },
              },
            },
          },
        },
        weeklySchedules: {
          where: { status: 'active' },
          orderBy: [{ weekday: 'asc' }, { startsMinute: 'asc' }],
        },
        breaks: {
          where: { status: 'active' },
          orderBy: [{ weekday: 'asc' }, { startsMinute: 'asc' }],
        },
        leaves: {
          where: { status: 'active', endsAt: { gt: now } },
          orderBy: { startsAt: 'asc' },
        },
      },
    });
    if (!doctor) throw new NotFoundException('Doctor was not found.');
    const period = (row: WeeklyPeriod) => ({
      weekday: row.weekday,
      startsMinute: row.startsMinute,
      endsMinute: row.endsMinute,
    });
    return {
      doctorId: doctor.id,
      displayName: doctor.displayName,
      visitMinutes: doctor.visitMinutes,
      defaultVisitMinutes: this.settings.int('booking.defaultVisitMinutes'),
      bookable: (doctor.availability?.status ?? 'available') === 'available',
      acceptingNewPatients: doctor.availability?.acceptingNewPatients ?? true,
      // Worked out now, so the owner sees the effect of every change.
      nextAvailableAt:
        (
          await this.appointments.nextFreeTime(doctor.id, now).catch(() => null)
        )?.toISOString() ?? null,
      clinics: doctor.clinicAssignments.map(({ clinic }) => ({
        clinicId: clinic.id,
        clinicName: clinic.name,
        timezone: clinic.timezone,
        clinicActive: clinic.status === 'active',
        openingHours: clinic.workingHours.map((row) => ({
          weekday: row.weekday,
          startsMinute: row.opensMinute,
          endsMinute: row.closesMinute,
        })),
        weekly: doctor.weeklySchedules
          .filter((row) => row.clinicId === clinic.id)
          .map(period),
        breaks: doctor.breaks
          .filter((row) => row.clinicId === clinic.id)
          .map(period),
        leave: doctor.leaves
          .filter((row) => row.clinicId === clinic.id)
          .map((row) => ({
            id: row.id,
            startsAt: row.startsAt.toISOString(),
            endsAt: row.endsAt.toISOString(),
          })),
      })),
    };
  }

  /** Replaces the doctor's week at one clinic. */
  async setWeek(
    actorId: string,
    doctorId: string,
    clinicId: string,
    input: { weekly: WeeklyPeriod[]; breaks: WeeklyPeriod[] },
    requestId: string,
  ) {
    const weekly = checkWeek(input.weekly, 'hours');
    if (!weekly.ok) throw new BadRequestException(weekly.error);
    const breaks = checkWeek(input.breaks, 'breaks');
    if (!breaks.ok) throw new BadRequestException(breaks.error);
    const stray = strayBreaks(weekly.periods, breaks.periods);
    if (stray.length)
      throw new BadRequestException(
        'Every break must sit inside working hours on the same day.',
      );
    await this.prisma.db.$transaction(async (tx) => {
      const organizationId = await this.assignment(tx, doctorId, clinicId);
      const opening = (
        await tx.clinicWorkingHours.findMany({
          where: { organizationId, clinicId, status: 'active' },
        })
      ).map((row) => ({
        weekday: row.weekday,
        startsMinute: row.opensMinute,
        endsMinute: row.closesMinute,
      }));
      if (strayBreaks(opening, weekly.periods).length)
        throw new BadRequestException(
          "Some hours are outside the clinic's opening hours. Set those on the clinic first.",
        );
      const elsewhere = await tx.doctorWeeklySchedule.findMany({
        where: {
          organizationId,
          doctorId,
          status: 'active',
          clinicId: { not: clinicId },
        },
      });
      if (
        weekly.periods.some((p) =>
          elsewhere.some(
            (o) =>
              o.weekday === p.weekday &&
              o.startsMinute < p.endsMinute &&
              o.endsMinute > p.startsMinute,
          ),
        )
      )
        throw new BadRequestException(
          "These hours overlap the doctor's hours at another clinic.",
        );
      const where = {
        organizationId,
        clinicId,
        doctorId,
        status: 'active' as const,
      };
      await tx.doctorWeeklySchedule.updateMany({
        where,
        data: { status: 'inactive' },
      });
      await tx.doctorBreak.updateMany({ where, data: { status: 'inactive' } });
      const rows = (periods: WeeklyPeriod[]) =>
        periods.map((p) => ({
          organizationId,
          clinicId,
          doctorId,
          weekday: p.weekday,
          startsMinute: p.startsMinute,
          endsMinute: p.endsMinute,
        }));
      if (weekly.periods.length)
        await tx.doctorWeeklySchedule.createMany({
          data: rows(weekly.periods),
        });
      if (breaks.periods.length)
        await tx.doctorBreak.createMany({ data: rows(breaks.periods) });
      await this.audit(
        tx,
        actorId,
        organizationId,
        doctorId,
        'platform.doctor.hours.updated',
        requestId,
        {
          clinicId,
          periods: weekly.periods.length,
          breaks: breaks.periods.length,
        },
      );
    });
    await this.refresh(doctorId);
  }

  /** Days off: at one clinic, or every clinic of the doctor. */
  async addLeave(
    actorId: string,
    doctorId: string,
    input: { clinicId?: string | null; startsAt: Date; endsAt: Date },
    requestId: string,
    now = new Date(),
  ) {
    const { startsAt, endsAt } = input;
    if (
      !Number.isFinite(startsAt.getTime()) ||
      !Number.isFinite(endsAt.getTime()) ||
      endsAt <= startsAt
    )
      throw new BadRequestException('The time off must end after it starts.');
    if (endsAt <= now)
      throw new BadRequestException('This time off is already over.');
    if (endsAt.getTime() - startsAt.getTime() > 366 * DAY_MS)
      throw new BadRequestException('Add at most a year of time off at once.');
    if (startsAt.getTime() > now.getTime() + 2 * 366 * DAY_MS)
      throw new BadRequestException('Add time off within the next two years.');
    const created = await this.prisma.db.$transaction(async (tx) => {
      const assignments = await tx.doctorClinicAssignment.findMany({
        where: {
          doctorId,
          status: 'active',
          ...(input.clinicId ? { clinicId: input.clinicId } : {}),
        },
        select: { organizationId: true, clinicId: true },
      });
      if (!assignments.length)
        throw new NotFoundException('The doctor does not work at this clinic.');
      const ids: string[] = [];
      for (const a of assignments) {
        const row = await tx.doctorLeave.create({
          data: { ...a, doctorId, startsAt, endsAt },
          select: { id: true },
        });
        ids.push(row.id);
      }
      await this.audit(
        tx,
        actorId,
        assignments[0]!.organizationId,
        doctorId,
        'platform.doctor.leave.added',
        requestId,
        {
          clinics: assignments.length,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
        },
      );
      return ids;
    });
    const affected = await this.bookedDuring(
      doctorId,
      startsAt,
      endsAt,
      input.clinicId ?? undefined,
    );
    await this.refresh(doctorId);
    return { ids: created, bookedVisits: affected };
  }

  async removeLeave(
    actorId: string,
    doctorId: string,
    leaveId: string,
    requestId: string,
  ) {
    await this.prisma.db.$transaction(async (tx) => {
      const row = await tx.doctorLeave.findFirst({
        where: { id: leaveId, doctorId, status: 'active' },
      });
      if (!row) throw new NotFoundException('Time off was not found.');
      await tx.doctorLeave.update({
        where: { id: leaveId },
        data: { status: 'inactive', version: { increment: 1 } },
      });
      await this.audit(
        tx,
        actorId,
        row.organizationId,
        doctorId,
        'platform.doctor.leave.removed',
        requestId,
        {
          clinicId: row.clinicId,
        },
      );
    });
    await this.refresh(doctorId);
  }

  /** Visit length and whether patients can book (new patients) in the app. */
  async setBooking(
    actorId: string,
    doctorId: string,
    input: {
      visitMinutes: number | null;
      bookable: boolean;
      acceptingNewPatients: boolean;
    },
    requestId: string,
  ) {
    const minutes = input.visitMinutes;
    if (
      minutes !== null &&
      (!Number.isInteger(minutes) ||
        minutes < 5 ||
        minutes > 240 ||
        minutes % 5 !== 0)
    )
      throw new BadRequestException(
        'Use a visit length of 5 to 240 minutes, in 5-minute steps.',
      );
    await this.prisma.db.$transaction(async (tx) => {
      const doctor = await tx.doctor.findUnique({
        where: { id: doctorId },
        select: { organizationId: true, visitMinutes: true },
      });
      if (!doctor) throw new NotFoundException('Doctor was not found.');
      await tx.doctor.update({
        where: { id: doctorId },
        data: { visitMinutes: minutes, version: { increment: 1 } },
      });
      await tx.doctorAvailabilityFoundation.upsert({
        where: { doctorId },
        create: {
          doctorId,
          status: input.bookable ? 'available' : 'unavailable',
          acceptingNewPatients: input.acceptingNewPatients,
        },
        update: {
          status: input.bookable ? 'available' : 'unavailable',
          acceptingNewPatients: input.acceptingNewPatients,
        },
      });
      await this.audit(
        tx,
        actorId,
        doctor.organizationId,
        doctorId,
        'platform.doctor.booking.updated',
        requestId,
        {
          visitMinutes: { from: doctor.visitMinutes, to: minutes },
          bookable: input.bookable,
          acceptingNewPatients: input.acceptingNewPatients,
        },
      );
    });
    await this.refresh(doctorId);
  }

  /** A clinic's opening hours, and the doctors' hours inside them. */
  async clinicHours(clinicId: string) {
    const clinic = await this.prisma.db.clinic.findUnique({
      where: { id: clinicId },
      select: {
        id: true,
        name: true,
        timezone: true,
        workingHours: {
          where: { status: 'active' },
          orderBy: [{ weekday: 'asc' }, { opensMinute: 'asc' }],
        },
        doctorWeeklySchedules: {
          where: { status: 'active' },
          select: {
            weekday: true,
            startsMinute: true,
            endsMinute: true,
            doctor: { select: { id: true, displayName: true } },
          },
        },
      },
    });
    if (!clinic) throw new NotFoundException('Clinic was not found.');
    return {
      clinicId: clinic.id,
      clinicName: clinic.name,
      timezone: clinic.timezone,
      periods: clinic.workingHours.map((row) => ({
        weekday: row.weekday,
        startsMinute: row.opensMinute,
        endsMinute: row.closesMinute,
      })),
      doctorPeriods: clinic.doctorWeeklySchedules.map((row) => ({
        doctorId: row.doctor.id,
        doctorName: row.doctor.displayName,
        weekday: row.weekday,
        startsMinute: row.startsMinute,
        endsMinute: row.endsMinute,
      })),
    };
  }

  /** Replaces a clinic's opening hours; doctors' hours must still fit. */
  async setClinicHours(
    actorId: string,
    clinicId: string,
    periods: WeeklyPeriod[],
    requestId: string,
  ) {
    const week = checkWeek(periods, 'hours');
    if (!week.ok) throw new BadRequestException(week.error);
    const doctors = await this.prisma.db.$transaction(async (tx) => {
      const clinic = await tx.clinic.findUnique({
        where: { id: clinicId },
        select: { organizationId: true },
      });
      if (!clinic) throw new NotFoundException('Clinic was not found.');
      const organizationId = clinic.organizationId;
      const working = await tx.doctorWeeklySchedule.findMany({
        where: { organizationId, clinicId, status: 'active' },
        select: {
          doctorId: true,
          weekday: true,
          startsMinute: true,
          endsMinute: true,
        },
      });
      if (strayBreaks(week.periods, working).length)
        throw new ConflictException(
          'Some doctors work outside these hours. Change their hours first.',
        );
      await tx.clinicWorkingHours.updateMany({
        where: { organizationId, clinicId, status: 'active' },
        data: { status: 'inactive' },
      });
      if (week.periods.length)
        await tx.clinicWorkingHours.createMany({
          data: week.periods.map((p) => ({
            organizationId,
            clinicId,
            weekday: p.weekday,
            opensMinute: p.startsMinute,
            closesMinute: p.endsMinute,
          })),
        });
      await tx.auditEvent.create({
        data: {
          organizationId,
          clinicId,
          actorUserId: actorId,
          action: 'platform.clinic.hours.updated',
          targetType: 'Clinic',
          targetId: clinicId,
          outcome: 'succeeded',
          requestId,
          metadata: { periods: week.periods.length },
          occurredAt: new Date(),
        },
      });
      return [...new Set(working.map((row) => row.doctorId))];
    });
    if (doctors.length) await this.refreshMany(doctors);
  }

  /** Upcoming visits that fall in a period (to warn about time off). */
  private bookedDuring(
    doctorId: string,
    from: Date,
    to: Date,
    clinicId?: string,
  ) {
    return this.prisma.db.appointment.count({
      where: {
        doctorId,
        ...(clinicId ? { clinicId } : {}),
        status: { in: ['scheduled', 'confirmed'] },
        startsAt: { lt: to },
        endsAt: { gt: from },
      },
    });
  }

  private refresh(doctorId: string) {
    return this.refreshMany([doctorId]);
  }

  private async refreshMany(doctorIds: string[]) {
    try {
      await this.appointments.refreshNextFree(doctorIds);
    } catch {
      this.logger.warn({ outcomeCode: 'NEXT_FREE_REFRESH_FAILED' });
    }
  }

  private async assignment(tx: Tx, doctorId: string, clinicId: string) {
    const row = await tx.doctorClinicAssignment.findFirst({
      where: { doctorId, clinicId, status: 'active' },
      select: { organizationId: true },
    });
    if (!row)
      throw new NotFoundException('The doctor does not work at this clinic.');
    return row.organizationId;
  }

  private audit(
    tx: Tx,
    actorId: string,
    organizationId: string,
    doctorId: string,
    action: string,
    requestId: string,
    metadata: Prisma.InputJsonObject,
  ) {
    return tx.auditEvent.create({
      data: {
        organizationId,
        actorUserId: actorId,
        action,
        targetType: 'Doctor',
        targetId: doctorId,
        outcome: 'succeeded',
        requestId,
        metadata,
        occurredAt: new Date(),
      },
    });
  }
}
