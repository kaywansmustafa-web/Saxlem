import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { BACKEND_CONFIGURATION } from '../../../config/configuration.module';
import type { BackendConfiguration } from '../../../config/environment';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { notifyPatient } from '../../../common/notifications/patient-notifications';

const HOUR = 3_600_000;
/** A visit booked at least a day ahead gets a reminder the day before. */
export const DAY_BEFORE = { from: 3 * HOUR, to: 24 * HOUR } as const;
/** And another shortly before, unless it was booked only just now. */
export const SOON = { from: 0, to: 2 * HOUR } as const;
/** "Almost your turn" when this many patients or fewer are ahead. */
export const ALMOST_AHEAD = 2;
/** "How was your visit?" this long after it ends, if not rated yet. */
export const REVIEW_ASK = { from: 1 * HOUR, to: 48 * HOUR } as const;

/** Which reminder (if any) is due for a visit, at `now`. */
export function dueReminder(
  startsAt: Date,
  createdAt: Date,
  now: Date,
): 'appointment.reminder.day-before' | 'appointment.reminder.soon' | null {
  const until = startsAt.getTime() - now.getTime(),
    bookedAhead = startsAt.getTime() - createdAt.getTime();
  if (until > SOON.from && until <= SOON.to && bookedAhead > SOON.to)
    return 'appointment.reminder.soon';
  if (
    until > DAY_BEFORE.from &&
    until <= DAY_BEFORE.to &&
    bookedAhead > DAY_BEFORE.to
  )
    return 'appointment.reminder.day-before';
  return null;
}

/**
 * Sends visit reminders and "almost your turn". Runs with the notification
 * worker; every notification is sent at most once per visit or queue ticket.
 */
@Injectable()
export class PatientReminderWorker
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(PatientReminderWorker.name);
  private timer?: NodeJS.Timeout;
  private running?: Promise<void>;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(BACKEND_CONFIGURATION)
    private readonly configuration: BackendConfiguration,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.configuration.notificationWorkerEnabled) return;
    const tick = () => {
      this.running = this.processTick()
        .then(() => undefined)
        .catch(() => this.logger.warn({ outcomeCode: 'REMINDER_TICK_FAILED' }));
    };
    tick();
    this.timer = setInterval(tick, 60_000);
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    await this.running;
  }

  async processTick(now = new Date()): Promise<number> {
    return (
      (await this.reminders(now)) +
      (await this.almostYourTurn()) +
      (await this.reviewRequests(now))
    );
  }

  private async reminders(now: Date): Promise<number> {
    const due = await this.prisma.db.appointment.findMany({
      where: {
        status: { in: ['scheduled', 'confirmed'] },
        startsAt: {
          gt: new Date(now.getTime() + SOON.from),
          lte: new Date(now.getTime() + DAY_BEFORE.to),
        },
        // Only patients with the app can be reminded.
        patientRegistration: {
          patientProfile: { patientAccountId: { not: null } },
        },
        arrival: { status: 'expected' },
      },
      select: {
        id: true,
        organizationId: true,
        clinicId: true,
        patientProfileId: true,
        startsAt: true,
        createdAt: true,
        clinic: { select: { name: true } },
        doctorAssignment: {
          select: { doctor: { select: { displayName: true } } },
        },
      },
      orderBy: { startsAt: 'asc' },
      take: 500,
    });
    let sent = 0;
    for (const appointment of due) {
      const type = dueReminder(
        appointment.startsAt,
        appointment.createdAt,
        now,
      );
      if (!type) continue;
      const written = await this.prisma.db.$transaction((tx) =>
        notifyPatient(tx, {
          organizationId: appointment.organizationId,
          clinicId: appointment.clinicId,
          patientProfileId: appointment.patientProfileId,
          type,
          aggregateType: 'appointment',
          aggregateId: appointment.id,
          priority: type === 'appointment.reminder.soon' ? 'high' : 'normal',
          once: true,
          context: {
            appointmentId: appointment.id,
            doctorName: appointment.doctorAssignment.doctor.displayName,
            clinicName: appointment.clinic.name,
            startsAt: appointment.startsAt.toISOString(),
          },
        }),
      );
      if (written) sent += 1;
    }
    return sent;
  }

  /** Asks once, after a visit that took place, how it went. */
  private async reviewRequests(now: Date): Promise<number> {
    const due = await this.prisma.db.appointment.findMany({
      where: {
        status: 'completed',
        endsAt: {
          gt: new Date(now.getTime() - REVIEW_ASK.to),
          lte: new Date(now.getTime() - REVIEW_ASK.from),
        },
        review: null,
        patientRegistration: {
          patientProfile: { patientAccountId: { not: null } },
        },
      },
      select: {
        id: true,
        organizationId: true,
        clinicId: true,
        patientProfileId: true,
        startsAt: true,
        clinic: { select: { name: true } },
        doctorAssignment: {
          select: { doctor: { select: { displayName: true } } },
        },
      },
      take: 500,
    });
    let sent = 0;
    for (const appointment of due) {
      const written = await this.prisma.db.$transaction((tx) =>
        notifyPatient(tx, {
          organizationId: appointment.organizationId,
          clinicId: appointment.clinicId,
          patientProfileId: appointment.patientProfileId,
          type: 'appointment.review.requested',
          aggregateType: 'appointment',
          aggregateId: appointment.id,
          priority: 'information',
          once: true,
          context: {
            appointmentId: appointment.id,
            doctorName: appointment.doctorAssignment.doctor.displayName,
            clinicName: appointment.clinic.name,
            startsAt: appointment.startsAt.toISOString(),
          },
        }),
      );
      if (written) sent += 1;
    }
    return sent;
  }

  private async almostYourTurn(): Promise<number> {
    const sessions = await this.prisma.db.queueSession.findMany({
      where: { status: 'open' },
      select: {
        id: true,
        doctorAssignment: {
          select: { doctor: { select: { displayName: true } } },
        },
        clinic: { select: { name: true } },
        entries: {
          where: { status: 'waiting' },
          orderBy: { ticketNumber: 'asc' },
          take: ALMOST_AHEAD + 1,
          select: {
            id: true,
            organizationId: true,
            clinicId: true,
            patientProfileId: true,
            appointmentId: true,
            ticketNumber: true,
          },
        },
      },
      take: 500,
    });
    let sent = 0;
    for (const session of sessions)
      for (const [ahead, entry] of session.entries.entries()) {
        const written = await this.prisma.db.$transaction((tx) =>
          notifyPatient(tx, {
            organizationId: entry.organizationId,
            clinicId: entry.clinicId,
            patientProfileId: entry.patientProfileId,
            type: 'queue.patient.almost',
            aggregateType: 'queueEntry',
            aggregateId: entry.id,
            priority: 'high',
            once: true,
            context: {
              appointmentId: entry.appointmentId,
              doctorName: session.doctorAssignment.doctor.displayName,
              clinicName: session.clinic.name,
              ticketNumber: entry.ticketNumber,
              ahead,
            },
          }),
        );
        if (written) sent += 1;
      }
    return sent;
  }
}
