import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AppSettings } from '../app-config/app-settings.service';
import { AppointmentService } from '../appointments/application/appointment.service';
import { doctorLanguages } from '../doctors/domain/doctor';
import { checkWeek, strayBreaks, type WeeklyPeriod } from './hours-rules';

type Tx = Prisma.TransactionClient;
const DAY_MS = 86_400_000;

/** Who is changing a doctor's settings, and from where. */
export interface HoursActor {
  readonly id: string;
  /** Owner Portal ('platform') or Clinic Portal ('clinic'). */
  readonly via: 'platform' | 'clinic';
  readonly requestId: string;
  /** Clinic Portal: the signed-in clinic; changes stay inside it. */
  readonly clinicId?: string;
}

/** A signed-in receptionist or clinic manager. */
export interface ClinicScope {
  readonly actorId: string;
  readonly organizationId?: string | undefined;
  readonly clinicId?: string | undefined;
  /** The doctors a receptionist works for (undefined: not chosen yet). */
  readonly doctorIds?: readonly string[] | undefined;
  readonly receptionist: boolean;
  readonly requestId: string;
}

type ClinicActor = HoursActor & {
  readonly organizationId: string;
  readonly clinicId: string;
};

export interface DoctorDetailsInput {
  readonly biography?: string;
  readonly yearsOfExperience?: number;
  readonly languages?: readonly string[];
  readonly consultationFeeIqd?: number | null;
  readonly followUpFeeIqd?: number | null;
}

const FEE_MAX = 5_000_000;
const BIOGRAPHY_MAX = 4000;

/**
 * A doctor's working hours, breaks, days off, visit length, app booking
 * switches, fees and profile. The owner sets them in the Owner Portal;
 * reception sets them for the doctors they work for in the Clinic Portal
 * (founder decision 2026-11-19). Booking, the reception day board and the
 * next free time all read these.
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

  /**
   * Clinic Portal: a receptionist may change only the doctors they work
   * for, and only at the clinic they signed in to; a clinic manager, any
   * doctor at that clinic.
   */
  async clinicDoctor(
    scope: ClinicScope,
    doctorId: string,
  ): Promise<ClinicActor> {
    const actor = this.clinicActor(scope);
    if (scope.receptionist && !scope.doctorIds?.includes(doctorId))
      throw new ForbiddenException('You do not work for this doctor.');
    const row = await this.prisma.db.doctorClinicAssignment.findFirst({
      where: {
        organizationId: actor.organizationId,
        clinicId: actor.clinicId,
        doctorId,
        status: 'active',
        doctor: { status: 'active' },
      },
      select: { doctorId: true },
    });
    if (!row)
      throw new NotFoundException('The doctor does not work at this clinic.');
    return actor;
  }

  clinicActor(scope: ClinicScope): ClinicActor {
    if (!scope.organizationId || !scope.clinicId)
      throw new ForbiddenException('A clinic session is required.');
    return {
      id: scope.actorId,
      via: 'clinic',
      requestId: scope.requestId,
      organizationId: scope.organizationId,
      clinicId: scope.clinicId,
    };
  }

  /** Clinic Portal → Doctors → a doctor: everything reception can change. */
  async clinicView(scope: ClinicScope, doctorId: string, now = new Date()) {
    const { clinicId } = await this.clinicDoctor(scope, doctorId);
    const doctor = await this.prisma.db.doctor.findUniqueOrThrow({
      where: { id: doctorId },
      select: {
        id: true,
        displayName: true,
        visitMinutes: true,
        biography: true,
        yearsOfExperience: true,
        languages: true,
        consultationFeeIqd: true,
        followUpFeeIqd: true,
        availability: true,
        specialtyAssignments: {
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
          select: {
            specialty: {
              select: { displayName: true, nameAr: true, nameKu: true },
            },
          },
        },
        weeklySchedules: {
          where: { status: 'active' },
          orderBy: [{ weekday: 'asc' }, { startsMinute: 'asc' }],
        },
        breaks: {
          where: { status: 'active', clinicId },
          orderBy: [{ weekday: 'asc' }, { startsMinute: 'asc' }],
        },
        leaves: {
          where: { status: 'active', clinicId, endsAt: { gt: now } },
          orderBy: { startsAt: 'asc' },
        },
      },
    });
    const clinic = await this.prisma.db.clinic.findUniqueOrThrow({
      where: { id: clinicId },
      select: {
        id: true,
        name: true,
        timezone: true,
        workingHours: {
          where: { status: 'active' },
          orderBy: [{ weekday: 'asc' }, { opensMinute: 'asc' }],
        },
      },
    });
    const period = (row: WeeklyPeriod) => ({
      weekday: row.weekday,
      startsMinute: row.startsMinute,
      endsMinute: row.endsMinute,
    });
    return {
      doctorId: doctor.id,
      displayName: doctor.displayName,
      specialties: doctor.specialtyAssignments.map(({ specialty }) => ({
        en: specialty.displayName,
        ar: specialty.nameAr,
        ku: specialty.nameKu,
      })),
      clinicId: clinic.id,
      clinicName: clinic.name,
      timezone: clinic.timezone,
      openingHours: clinic.workingHours.map((row) => ({
        weekday: row.weekday,
        startsMinute: row.opensMinute,
        endsMinute: row.closesMinute,
      })),
      weekly: doctor.weeklySchedules
        .filter((row) => row.clinicId === clinicId)
        .map(period),
      breaks: doctor.breaks.map(period),
      // Hours at the doctor's other clinics (so the week can't overlap).
      elsewhere: doctor.weeklySchedules
        .filter((row) => row.clinicId !== clinicId)
        .map(period),
      leave: doctor.leaves.map((row) => ({
        id: row.id,
        startsAt: row.startsAt.toISOString(),
        endsAt: row.endsAt.toISOString(),
      })),
      visitMinutes: doctor.visitMinutes,
      defaultVisitMinutes: this.settings.int('booking.defaultVisitMinutes'),
      bookable: (doctor.availability?.status ?? 'available') === 'available',
      acceptingNewPatients: doctor.availability?.acceptingNewPatients ?? true,
      nextAvailableAt:
        (
          await this.appointments.nextFreeTime(doctor.id, now).catch(() => null)
        )?.toISOString() ?? null,
      biography: doctor.biography,
      yearsOfExperience: doctor.yearsOfExperience,
      languages: doctor.languages,
      consultationFeeIqd: doctor.consultationFeeIqd,
      followUpFeeIqd: doctor.followUpFeeIqd,
      defaultFeeIqd: this.settings.int('booking.defaultFeeIqd'),
    };
  }

  /** Fees and the profile patients read (name and specialties stay with Saxlem). */
  async setDetails(
    actor: HoursActor,
    doctorId: string,
    input: DoctorDetailsInput,
  ) {
    const fee = (value: number | null | undefined, label: string) => {
      if (
        value !== undefined &&
        value !== null &&
        (!Number.isInteger(value) || value < 0 || value > FEE_MAX)
      )
        throw new BadRequestException(
          `${label} must be 0 to ${FEE_MAX.toLocaleString('en-US')} IQD.`,
        );
    };
    fee(input.consultationFeeIqd, 'The first-visit fee');
    fee(input.followUpFeeIqd, 'The follow-up fee');
    const biography = input.biography?.trim();
    if (biography !== undefined && biography.length > BIOGRAPHY_MAX)
      throw new BadRequestException(
        `Keep the biography under ${BIOGRAPHY_MAX} characters.`,
      );
    const years = input.yearsOfExperience;
    if (
      years !== undefined &&
      (!Number.isInteger(years) || years < 0 || years > 80)
    )
      throw new BadRequestException('Years of experience must be 0 to 80.');
    const languages = input.languages
      ? [...new Set(input.languages)]
      : undefined;
    if (
      languages &&
      (!languages.length ||
        languages.some(
          (x) => !(doctorLanguages as readonly string[]).includes(x),
        ))
    )
      throw new BadRequestException(
        `Choose at least one language: ${doctorLanguages.join(', ')}.`,
      );
    await this.prisma.db.$transaction(async (tx) => {
      const before = await tx.doctor.findUnique({
        where: { id: doctorId },
        select: {
          organizationId: true,
          consultationFeeIqd: true,
          followUpFeeIqd: true,
        },
      });
      if (!before) throw new NotFoundException('Doctor was not found.');
      await tx.doctor.update({
        where: { id: doctorId },
        data: {
          ...(biography !== undefined ? { biography } : {}),
          ...(years !== undefined ? { yearsOfExperience: years } : {}),
          ...(languages ? { languages } : {}),
          ...(input.consultationFeeIqd !== undefined
            ? { consultationFeeIqd: input.consultationFeeIqd }
            : {}),
          ...(input.followUpFeeIqd !== undefined
            ? { followUpFeeIqd: input.followUpFeeIqd }
            : {}),
          version: { increment: 1 },
        },
      });
      await this.audit(
        tx,
        actor,
        before.organizationId,
        doctorId,
        'details.updated',
        {
          fields: Object.keys(input).filter(
            (key) => input[key as keyof DoctorDetailsInput] !== undefined,
          ),
          ...(input.consultationFeeIqd !== undefined
            ? {
                consultationFeeIqd: {
                  from: before.consultationFeeIqd,
                  to: input.consultationFeeIqd,
                },
              }
            : {}),
          ...(input.followUpFeeIqd !== undefined
            ? {
                followUpFeeIqd: {
                  from: before.followUpFeeIqd,
                  to: input.followUpFeeIqd,
                },
              }
            : {}),
        },
      );
    });
  }

  /** Replaces the doctor's week at one clinic. */
  async setWeek(
    actor: HoursActor,
    doctorId: string,
    clinicId: string,
    input: { weekly: WeeklyPeriod[]; breaks: WeeklyPeriod[] },
  ) {
    if (actor.clinicId && actor.clinicId !== clinicId)
      throw new ForbiddenException('Hours can be changed only at this clinic.');
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
      await this.audit(tx, actor, organizationId, doctorId, 'hours.updated', {
        clinicId,
        periods: weekly.periods.length,
        breaks: breaks.periods.length,
      });
    });
    await this.refresh(doctorId);
  }

  /** Days off: at one clinic, or every clinic of the doctor. */
  async addLeave(
    actor: HoursActor,
    doctorId: string,
    input: { clinicId?: string | null; startsAt: Date; endsAt: Date },
    now = new Date(),
  ) {
    const { startsAt, endsAt } = input;
    // Reception adds time off at their own clinic only.
    const clinicId = actor.clinicId ?? input.clinicId ?? null;
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
          ...(clinicId ? { clinicId } : {}),
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
        actor,
        assignments[0]!.organizationId,
        doctorId,
        'leave.added',
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
      clinicId ?? undefined,
    );
    await this.refresh(doctorId);
    return { ids: created, bookedVisits: affected };
  }

  async removeLeave(actor: HoursActor, doctorId: string, leaveId: string) {
    await this.prisma.db.$transaction(async (tx) => {
      const row = await tx.doctorLeave.findFirst({
        where: {
          id: leaveId,
          doctorId,
          status: 'active',
          ...(actor.clinicId ? { clinicId: actor.clinicId } : {}),
        },
      });
      if (!row) throw new NotFoundException('Time off was not found.');
      await tx.doctorLeave.update({
        where: { id: leaveId },
        data: { status: 'inactive', version: { increment: 1 } },
      });
      await this.audit(
        tx,
        actor,
        row.organizationId,
        doctorId,
        'leave.removed',
        {
          clinicId: row.clinicId,
        },
      );
    });
    await this.refresh(doctorId);
  }

  /** Visit length and whether patients can book (new patients) in the app. */
  async setBooking(
    actor: HoursActor,
    doctorId: string,
    input: {
      visitMinutes: number | null;
      bookable: boolean;
      acceptingNewPatients: boolean;
    },
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
        actor,
        doctor.organizationId,
        doctorId,
        'booking.updated',
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
    actor: HoursActor,
    clinicId: string,
    periods: WeeklyPeriod[],
  ) {
    if (actor.clinicId && actor.clinicId !== clinicId)
      throw new ForbiddenException('Only this clinic can be changed.');
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
          actorUserId: actor.id,
          action: `${actor.via}.clinic.hours.updated`,
          targetType: 'Clinic',
          targetId: clinicId,
          outcome: 'succeeded',
          requestId: actor.requestId,
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

  /** "platform.doctor.hours.updated" or "clinic.doctor.hours.updated". */
  private audit(
    tx: Tx,
    actor: HoursActor,
    organizationId: string,
    doctorId: string,
    action: string,
    metadata: Prisma.InputJsonObject,
  ) {
    return tx.auditEvent.create({
      data: {
        organizationId,
        ...(actor.clinicId ? { clinicId: actor.clinicId } : {}),
        actorUserId: actor.id,
        action: `${actor.via}.doctor.${action}`,
        targetType: 'Doctor',
        targetId: doctorId,
        outcome: 'succeeded',
        requestId: actor.requestId,
        metadata,
        occurredAt: new Date(),
      },
    });
  }
}
