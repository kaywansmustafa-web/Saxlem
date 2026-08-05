import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type {
  ClinicHoursProjection,
  ClinicScheduleProjection,
  DoctorScheduleProjection,
  HolidayProjection,
  RecurringPeriodProjection,
  ScheduleExceptionProjection,
  UtcPeriodProjection,
  Weekday,
} from '../domain/doctor-schedule';
import type {
  DoctorScheduleRepository,
  ScheduleReadScope,
  ScheduleReadWindow,
} from '../domain/doctor-schedule.repository';

@Injectable()
export class PrismaDoctorScheduleRepository implements DoctorScheduleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findDoctorSchedule(
    doctorId: string,
    scope: ScheduleReadScope,
    window: ScheduleReadWindow,
  ): Promise<DoctorScheduleProjection | null> {
    const doctor = await this.prisma.db.doctor.findFirst({
      where: {
        id: doctorId,
        status: 'active',
        organization: { status: 'active' },
        specialtyAssignments: { some: { specialty: { status: 'active' } } },
        ...(scope.organizationId
          ? { organizationId: scope.organizationId }
          : {}),
        ...(scope.doctorActorId
          ? { staffAccount: { userId: scope.doctorActorId } }
          : {}),
        clinicAssignments: {
          some: {
            ...(scope.clinicId ? { clinicId: scope.clinicId } : {}),
            ...(scope.clinicAssignmentVisibility === 'active'
              ? { status: 'active' }
              : {}),
            clinic: { status: 'active' },
          },
        },
      },
      select: {
        id: true,
        organizationId: true,
        displayName: true,
        clinicAssignments: {
          where: {
            ...(scope.clinicId ? { clinicId: scope.clinicId } : {}),
            ...(scope.clinicAssignmentVisibility === 'active'
              ? { status: 'active' }
              : {}),
            clinic: { status: 'active' },
          },
          select: {
            clinic: { select: { id: true, name: true, timezone: true } },
          },
          orderBy: [{ clinic: { name: 'asc' } }, { clinicId: 'asc' }],
        },
      },
    });
    if (!doctor || doctor.clinicAssignments.length === 0) return null;
    const clinics = await Promise.all(
      doctor.clinicAssignments.map(({ clinic }) =>
        this.clinicSchedule(doctor.organizationId, doctor.id, clinic, window),
      ),
    );
    return Object.freeze({
      doctorId: doctor.id,
      doctorName: doctor.displayName,
      organizationId: doctor.organizationId,
      clinics: Object.freeze(clinics),
    });
  }

  async findClinicHours(
    clinicId: string,
    scope: ScheduleReadScope,
  ): Promise<ClinicHoursProjection | null> {
    const clinic = await this.prisma.db.clinic.findFirst({
      where: {
        id: clinicId,
        status: 'active',
        organization: { status: 'active' },
        ...(scope.organizationId
          ? { organizationId: scope.organizationId }
          : {}),
      },
      select: {
        id: true,
        organizationId: true,
        name: true,
        timezone: true,
        workingHours: {
          where: { status: 'active' },
          orderBy: [{ weekday: 'asc' }, { opensMinute: 'asc' }, { id: 'asc' }],
        },
      },
    });
    if (!clinic) return null;
    return Object.freeze({
      clinicId: clinic.id,
      clinicName: clinic.name,
      organizationId: clinic.organizationId,
      timezone: this.timezone(clinic.timezone),
      workingHours: Object.freeze(
        clinic.workingHours.map((period) =>
          this.recurring(
            period.id,
            period.weekday,
            period.opensMinute,
            period.closesMinute,
          ),
        ),
      ),
    });
  }

  async recordReads(
    inputs: readonly {
      actorId: string;
      organizationId: string;
      clinicId?: string | undefined;
      targetType: 'Doctor' | 'Clinic';
      targetId: string;
      requestId: string;
      action: 'schedule.viewed' | 'availability.viewed';
    }[],
  ): Promise<void> {
    await this.prisma.db.$transaction(
      inputs.map((input) =>
        this.prisma.db.auditEvent.create({
          data: {
            actorUserId: input.actorId,
            organizationId: input.organizationId,
            clinicId: input.clinicId ?? null,
            action: input.action,
            targetType: input.targetType,
            targetId: input.targetId,
            outcome: 'succeeded',
            requestId: input.requestId,
            occurredAt: new Date(),
          },
        }),
      ),
    );
  }

  private async clinicSchedule(
    organizationId: string,
    doctorId: string,
    clinic: { id: string; name: string; timezone: string },
    window: ScheduleReadWindow,
  ): Promise<ClinicScheduleProjection> {
    const scope = { organizationId, clinicId: clinic.id, doctorId };
    const [hours, weekly, breaks, leave, holidays, exceptions] =
      await this.prisma.db.$transaction([
        this.prisma.db.clinicWorkingHours.findMany({
          where: { organizationId, clinicId: clinic.id, status: 'active' },
          orderBy: [{ weekday: 'asc' }, { opensMinute: 'asc' }, { id: 'asc' }],
        }),
        this.prisma.db.doctorWeeklySchedule.findMany({
          where: { ...scope, status: 'active' },
          orderBy: [{ weekday: 'asc' }, { startsMinute: 'asc' }, { id: 'asc' }],
        }),
        this.prisma.db.doctorBreak.findMany({
          where: { ...scope, status: 'active' },
          orderBy: [{ weekday: 'asc' }, { startsMinute: 'asc' }, { id: 'asc' }],
        }),
        this.prisma.db.doctorLeave.findMany({
          where: {
            ...scope,
            status: 'active',
            startsAt: { lt: window.endsAt },
            endsAt: { gt: window.startsAt },
          },
          orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
        }),
        this.prisma.db.doctorHoliday.findMany({
          where: {
            ...scope,
            status: 'active',
            startsAt: { lt: window.endsAt },
            endsAt: { gt: window.startsAt },
          },
          orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
        }),
        this.prisma.db.doctorScheduleException.findMany({
          where: {
            ...scope,
            status: 'active',
            startsAt: { lt: window.endsAt },
            endsAt: { gt: window.startsAt },
          },
          orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
        }),
      ]);
    return Object.freeze({
      clinicId: clinic.id,
      clinicName: clinic.name,
      timezone: this.timezone(clinic.timezone),
      workingHours: Object.freeze(
        hours.map((x) =>
          this.recurring(x.id, x.weekday, x.opensMinute, x.closesMinute),
        ),
      ),
      weeklySchedule: Object.freeze(
        weekly.map((x) =>
          this.recurring(x.id, x.weekday, x.startsMinute, x.endsMinute),
        ),
      ),
      breaks: Object.freeze(
        breaks.map((x) =>
          this.recurring(x.id, x.weekday, x.startsMinute, x.endsMinute),
        ),
      ),
      leave: Object.freeze(
        leave.map((x) => this.utcPeriod(x.id, x.startsAt, x.endsAt)),
      ),
      holidays: Object.freeze(
        holidays.map((x): HolidayProjection =>
          Object.freeze({
            ...this.utcPeriod(x.id, x.startsAt, x.endsAt),
            name: x.name,
          }),
        ),
      ),
      exceptions: Object.freeze(
        exceptions.map((x): ScheduleExceptionProjection =>
          Object.freeze({
            ...this.utcPeriod(x.id, x.startsAt, x.endsAt),
            kind: x.kind,
          }),
        ),
      ),
    });
  }

  private recurring(
    id: string,
    weekday: number,
    startsMinute: number,
    endsMinute: number,
  ): RecurringPeriodProjection {
    return Object.freeze({
      id,
      weekday: weekday as Weekday,
      startsMinute,
      endsMinute,
    });
  }

  private utcPeriod(
    id: string,
    startsAt: Date,
    endsAt: Date,
  ): UtcPeriodProjection {
    return Object.freeze({
      id,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
    });
  }

  private timezone(identifier: string) {
    return Object.freeze({
      identifier,
      instantStorage: 'UTC' as const,
      recurringRuleClock: 'clinicLocalWallClock' as const,
    });
  }
}
