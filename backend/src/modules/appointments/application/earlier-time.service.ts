import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { notifyPatient } from '../../../common/notifications/patient-notifications';
import type { AppointmentAccess } from '../domain/appointment';
import {
  APPOINTMENT_REPOSITORY,
  type AppointmentRepository,
} from '../domain/appointment.repository';
import { AppointmentService } from './appointment.service';

const HOUR = 3_600_000;
/** Watching only makes sense for a visit at least this far away. */
export const EARLIER_MIN_LEAD = 3 * HOUR;
/** An offered time is at least this far from now… */
export const EARLIER_SLOT_FROM_NOW = 2 * HOUR;
/** …and at least this much earlier than the visit. */
export const EARLIER_BY = 30 * 60_000;
/** At most one offer this often, per visit. */
export const EARLIER_OFFER_EVERY = 6 * HOUR;

export interface EarlierStatus {
  readonly watching: boolean;
  readonly offer: {
    readonly startsAt: string;
    readonly endsAt: string;
    readonly durationMinutes: number;
  } | null;
}

/** The local calendar date at the clinic, "2026-11-19". */
export function clinicDate(at: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone }).format(at);
  } catch {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Baghdad',
    }).format(at);
  }
}

/**
 * "Tell me if an earlier time opens": the patient keeps their visit and is
 * told (at most every 6 hours) when the same doctor has a free time at
 * least 30 minutes earlier and 2 hours from now. Moving is up to them.
 */
@Injectable()
export class EarlierTimeService {
  private readonly logger = new Logger(EarlierTimeService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointments: AppointmentRepository,
    private readonly booking: AppointmentService,
  ) {}

  async status(
    access: AppointmentAccess,
    appointmentId: string,
    now = new Date(),
  ): Promise<EarlierStatus> {
    const visit = await this.own(access, appointmentId);
    const request = await this.prisma.db.earlierTimeRequest.findUnique({
      where: { appointmentId: visit.id },
    });
    const start = new Date(visit.startsAt).getTime();
    const offered = request?.lastOfferedStartsAt;
    const offer =
      offered &&
      offered.getTime() > now.getTime() + HOUR &&
      offered.getTime() <= start - EARLIER_BY
        ? {
            startsAt: offered.toISOString(),
            endsAt: new Date(
              offered.getTime() + visit.durationMinutes * 60_000,
            ).toISOString(),
            durationMinutes: visit.durationMinutes,
          }
        : null;
    return { watching: !!request, offer };
  }

  async watch(
    access: AppointmentAccess,
    appointmentId: string,
    now = new Date(),
  ): Promise<EarlierStatus> {
    const visit = await this.own(access, appointmentId);
    if (
      (visit.status !== 'scheduled' && visit.status !== 'confirmed') ||
      new Date(visit.startsAt).getTime() - now.getTime() < EARLIER_MIN_LEAD
    )
      throw new ConflictException('This visit is too soon to move earlier.');
    await this.prisma.db.earlierTimeRequest.upsert({
      where: { appointmentId: visit.id },
      create: {
        appointmentId: visit.id,
        organizationId: visit.organizationId,
        clinicId: visit.clinicId,
        patientProfileId: visit.patientProfileId,
      },
      update: {},
    });
    return this.status(access, appointmentId, now);
  }

  async stop(access: AppointmentAccess, appointmentId: string): Promise<void> {
    const visit = await this.own(access, appointmentId);
    await this.prisma.db.earlierTimeRequest.deleteMany({
      where: { appointmentId: visit.id },
    });
  }

  /** Looks for earlier times for everyone watching. Returns offers sent. */
  async offer(now = new Date()): Promise<number> {
    const requests = await this.prisma.db.earlierTimeRequest.findMany({
      orderBy: { createdAt: 'asc' },
      take: 200,
      include: {
        appointment: {
          select: {
            id: true,
            organizationId: true,
            clinicId: true,
            doctorId: true,
            patientProfileId: true,
            type: true,
            status: true,
            startsAt: true,
            durationMinutes: true,
            clinic: { select: { name: true, timezone: true } },
            doctorAssignment: {
              select: { doctor: { select: { displayName: true } } },
            },
            patientRegistration: {
              select: {
                patientProfile: {
                  select: { patientAccount: { select: { userId: true } } },
                },
              },
            },
          },
        },
      },
    });
    let sent = 0;
    for (const request of requests) {
      const visit = request.appointment;
      const userId =
        visit.patientRegistration.patientProfile.patientAccount?.userId;
      if (
        !userId ||
        (visit.status !== 'scheduled' && visit.status !== 'confirmed') ||
        visit.startsAt.getTime() - now.getTime() < EARLIER_MIN_LEAD
      ) {
        await this.prisma.db.earlierTimeRequest.deleteMany({
          where: { appointmentId: visit.id },
        });
        continue;
      }
      if (
        request.lastOfferedAt &&
        now.getTime() - request.lastOfferedAt.getTime() < EARLIER_OFFER_EVERY
      )
        continue;
      try {
        const slot = await this.earliestFree(userId, visit, now);
        if (!slot || slot.getTime() === request.lastOfferedStartsAt?.getTime())
          continue;
        await this.prisma.db.$transaction(async (tx) => {
          await tx.earlierTimeRequest.update({
            where: { appointmentId: visit.id },
            data: { lastOfferedStartsAt: slot, lastOfferedAt: now },
          });
          await notifyPatient(tx, {
            organizationId: visit.organizationId,
            clinicId: visit.clinicId,
            patientProfileId: visit.patientProfileId,
            type: 'appointment.earlier.available',
            aggregateType: 'appointment',
            aggregateId: visit.id,
            priority: 'high',
            context: {
              appointmentId: visit.id,
              doctorName: visit.doctorAssignment.doctor.displayName,
              clinicName: visit.clinic.name,
              startsAt: slot.toISOString(),
            },
            occurredAt: now,
          });
        });
        sent += 1;
      } catch {
        this.logger.warn({ outcomeCode: 'EARLIER_TIME_CHECK_FAILED' });
      }
    }
    return sent;
  }

  private async earliestFree(
    userId: string,
    visit: {
      doctorId: string;
      clinicId: string;
      patientProfileId: string;
      type: 'initial' | 'followUp';
      startsAt: Date;
      durationMinutes: number;
      clinic: { timezone: string };
    },
    now: Date,
  ): Promise<Date | null> {
    const zone = visit.clinic.timezone;
    const from = clinicDate(now, zone);
    const last = new Date(
      Math.min(visit.startsAt.getTime(), now.getTime() + 30 * 86_400_000),
    );
    const options = await this.booking.bookingOptions(
      {
        actorId: userId,
        patient: true,
        doctor: false,
        platformAdministrator: false,
      },
      visit.doctorId,
      visit.clinicId,
      visit.patientProfileId,
      visit.type,
      from,
      clinicDate(last, zone),
      'earlier-time-worker',
    );
    const earliest = now.getTime() + EARLIER_SLOT_FROM_NOW;
    const latest = visit.startsAt.getTime() - EARLIER_BY;
    for (const day of options.days)
      for (const slot of day.slots) {
        const at = new Date(slot.startsAt).getTime();
        if (
          at >= earliest &&
          at <= latest &&
          slot.durationMinutes === visit.durationMinutes
        )
          return new Date(at);
      }
    return null;
  }

  private async own(access: AppointmentAccess, appointmentId: string) {
    if (!access.patient)
      throw new ForbiddenException('Only patients ask for an earlier time.');
    const visit = await this.appointments.get(access, appointmentId);
    if (!visit) throw new NotFoundException('Appointment was not found.');
    return visit;
  }
}
