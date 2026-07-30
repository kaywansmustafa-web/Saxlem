import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { Prisma, type NotificationPriority } from '@prisma/client';
import { BACKEND_CONFIGURATION } from '../../../config/configuration.module';
import type { BackendConfiguration } from '../../../config/environment';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import {
  SUPPORTED_QUEUE_NOTIFICATION_EVENTS,
  type QueueNotificationEvent,
} from '../domain/notification';

interface LockedOutboxEvent {
  id: string;
  eventType: string;
  payload: unknown;
  occurredAt: Date;
  attempts: number;
}

interface Recipient {
  userId: string;
  patientProfileId: string | null;
}

const patientSpecific = new Set<QueueNotificationEvent>([
  'queue.entry.enqueued',
  'queue.patient.called',
  'queue.patient.recalled',
  'queue.patient.no-response',
  'queue.consultation.started',
  'queue.consultation.completed',
]);

@Injectable()
export class NotificationOutboxWorker
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(NotificationOutboxWorker.name);
  private readonly abortController = new AbortController();
  private stopping = false;
  private loop?: Promise<void>;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(BACKEND_CONFIGURATION)
    private readonly configuration: BackendConfiguration,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.configuration.notificationWorkerEnabled) return;
    this.loop = this.run();
  }

  async onApplicationShutdown(): Promise<void> {
    this.stopping = true;
    this.abortController.abort();
    await this.loop;
  }

  async processTick(): Promise<number> {
    let processed = 0;
    while (
      !this.stopping &&
      processed < this.configuration.notificationWorkerTickLimit
    ) {
      const outcome = await this.processOne();
      if (outcome === 'empty') break;
      processed += 1;
    }
    return processed;
  }

  private async run(): Promise<void> {
    while (!this.stopping) {
      try {
        await this.processTick();
      } catch {
        this.logger.warn({ outcomeCode: 'WORKER_TICK_FAILED' });
      }
      if (this.stopping) break;
      await this.delay(this.configuration.notificationWorkerPollIntervalMs);
    }
  }

  private async processOne(): Promise<'processed' | 'failed' | 'empty'> {
    let locked: LockedOutboxEvent | undefined;
    try {
      const result = await this.prisma.db.$transaction(async (tx) => {
        const rows = await tx.$queryRaw<LockedOutboxEvent[]>`
          SELECT id, event_type AS "eventType", payload, occurred_at AS "occurredAt", attempts
          FROM outbox_events
          WHERE published_at IS NULL
            AND failed_at IS NULL
            AND (next_attempt_at IS NULL OR next_attempt_at <= now())
            AND event_type IN (
              'queue.session.opened', 'queue.session.paused',
              'queue.session.resumed', 'queue.session.closed',
              'queue.entry.enqueued', 'queue.patient.called',
              'queue.patient.recalled', 'queue.patient.no-response',
              'queue.consultation.started', 'queue.consultation.completed'
            )
          ORDER BY occurred_at, id
          FOR UPDATE SKIP LOCKED
          LIMIT 1
        `;
        locked = rows[0];
        if (!locked) return false;
        const event = this.validate(locked);
        const candidates = await this.recipients(tx, event);
        await this.lockRecipients(tx, candidates);
        await this.lockEligibility(tx, event, candidates);
        const candidateIds = new Set(candidates.map(({ userId }) => userId));
        const recipients = (await this.recipients(tx, event)).filter(
          ({ userId }) => candidateIds.has(userId),
        );
        if (recipients.length) {
          await tx.notificationRecord.createMany({
            data: recipients.map((recipient) => ({
              sourceOutboxEventId: event.id,
              organizationId: event.organizationId,
              clinicId: event.clinicId,
              recipientUserId: recipient.userId,
              patientProfileId: recipient.patientProfileId,
              type: event.eventType,
              priority: this.priority(event.eventType),
              payload: {
                actionCode: event.eventType,
              },
              occurredAt: event.occurredAt,
            })),
            skipDuplicates: true,
          });
        }
        await tx.outboxEvent.update({
          where: { id: event.id },
          data: {
            publishedAt: new Date(),
            attempts: { increment: 1 },
            nextAttemptAt: null,
            lastErrorCode: null,
          },
        });
        return true;
      });
      if (!result) return 'empty';
      this.logger.log({
        sourceOutboxId: locked!.id,
        eventType: locked!.eventType,
        attempt: locked!.attempts + 1,
        outcomeCode: 'PROJECTED',
      });
      return 'processed';
    } catch (error) {
      this.logger.warn({ outcomeCode: this.safeErrorCode(error) });
      if (locked) {
        try {
          await this.recordFailure(locked);
        } catch {
          this.logger.warn({
            sourceOutboxId: locked.id,
            eventType: locked.eventType,
            outcomeCode: 'RETRY_BOOKKEEPING_FAILED',
          });
          throw new Error('RETRY_BOOKKEEPING_FAILED');
        }
      }
      return 'failed';
    }
  }

  private async lockRecipients(
    tx: Prisma.TransactionClient,
    recipients: readonly Recipient[],
  ): Promise<void> {
    for (const recipient of recipients)
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(
          hashtextextended(
            ${`notification-recipient:${recipient.userId}`},
            0
          )
        )
      `;
  }

  /**
   * Global projection lock order: users, patient accounts, patient profiles,
   * organization registrations, staff accounts, clinic memberships, doctors,
   * doctor assignments, organization, clinic. UUID ordering is deterministic.
   */
  private async lockEligibility(
    tx: Prisma.TransactionClient,
    event: ReturnType<NotificationOutboxWorker['validate']>,
    candidates: readonly Recipient[],
  ): Promise<void> {
    let stage = 'USERS';
    try {
      const userIds = candidates.map(({ userId }) => userId).sort();
      if (userIds.length) {
        await tx.$queryRaw`
        SELECT id FROM users
        WHERE id IN (${Prisma.join(userIds)})
        ORDER BY id FOR UPDATE
      `;
        stage = 'PATIENT_ACCOUNTS';
        await tx.$queryRaw`
        SELECT id FROM patient_accounts
        WHERE user_id IN (${Prisma.join(userIds)})
        ORDER BY id FOR UPDATE
      `;
        stage = 'PATIENT_PROFILES';
        await tx.$queryRaw`
        SELECT pp.id
        FROM patient_profiles pp
        JOIN patient_accounts pa ON pa.id = pp.patient_account_id
        WHERE pa.user_id IN (${Prisma.join(userIds)})
        ORDER BY pp.id FOR UPDATE OF pp
      `;
        stage = 'PATIENT_REGISTRATIONS';
        await tx.$queryRaw`
        SELECT opp.patient_profile_id
        FROM organization_patient_profiles opp
        JOIN patient_profiles pp ON pp.id = opp.patient_profile_id
        JOIN patient_accounts pa ON pa.id = pp.patient_account_id
        WHERE opp.organization_id = ${event.organizationId}::uuid
          AND pa.user_id IN (${Prisma.join(userIds)})
        ORDER BY opp.patient_profile_id FOR UPDATE OF opp
      `;
        stage = 'STAFF_ACCOUNTS';
        await tx.$queryRaw`
        SELECT id FROM staff_accounts
        WHERE user_id IN (${Prisma.join(userIds)})
        ORDER BY id FOR UPDATE
      `;
        stage = 'CLINIC_MEMBERSHIPS';
        await tx.$queryRaw`
        SELECT id FROM clinic_memberships
        WHERE organization_id = ${event.organizationId}::uuid
          AND clinic_id = ${event.clinicId}::uuid
          AND user_id IN (${Prisma.join(userIds)})
        ORDER BY id FOR UPDATE
      `;
      }
      stage = 'DOCTORS';
      await tx.$queryRaw`
      SELECT d.id
      FROM doctors d
      JOIN queue_sessions qs ON qs.doctor_id = d.id
      WHERE qs.id = ${event.queueSessionId}::uuid
        AND qs.organization_id = ${event.organizationId}::uuid
        AND qs.clinic_id = ${event.clinicId}::uuid
      ORDER BY d.id FOR UPDATE OF d
    `;
      stage = 'DOCTOR_ASSIGNMENTS';
      await tx.$queryRaw`
      SELECT dca.organization_id, dca.clinic_id, dca.doctor_id
      FROM doctor_clinic_assignments dca
      JOIN queue_sessions qs
        ON qs.organization_id = dca.organization_id
       AND qs.clinic_id = dca.clinic_id
       AND qs.doctor_id = dca.doctor_id
      WHERE qs.id = ${event.queueSessionId}::uuid
      ORDER BY dca.organization_id, dca.clinic_id, dca.doctor_id
      FOR UPDATE OF dca
    `;
      stage = 'ORGANIZATION';
      await tx.$queryRaw`
      SELECT id FROM organizations
      WHERE id = ${event.organizationId}::uuid
      ORDER BY id FOR UPDATE
    `;
      stage = 'CLINIC';
      await tx.$queryRaw`
      SELECT id FROM clinics
      WHERE organization_id = ${event.organizationId}::uuid
        AND id = ${event.clinicId}::uuid
      ORDER BY id FOR UPDATE
    `;
    } catch {
      this.logger.warn({ outcomeCode: `ELIGIBILITY_LOCK_${stage}_FAILED` });
      throw new Error('ELIGIBILITY_LOCK_FAILED');
    }
  }

  private validate(event: LockedOutboxEvent) {
    if (
      !SUPPORTED_QUEUE_NOTIFICATION_EVENTS.includes(
        event.eventType as QueueNotificationEvent,
      )
    )
      throw new Error('UNSUPPORTED_EVENT');
    const payload =
      event.payload && typeof event.payload === 'object'
        ? (event.payload as Record<string, unknown>)
        : {};
    const organizationId = this.uuid(payload.organizationId);
    const clinicId = this.uuid(payload.clinicId);
    const queueSessionId = this.uuid(payload.queueSessionId);
    const queueEntryId =
      payload.queueEntryId === null || payload.queueEntryId === undefined
        ? null
        : this.uuid(payload.queueEntryId);
    if (
      patientSpecific.has(event.eventType as QueueNotificationEvent) &&
      !queueEntryId
    )
      throw new Error('INVALID_EVENT_PAYLOAD');
    return {
      ...event,
      eventType: event.eventType as QueueNotificationEvent,
      organizationId,
      clinicId,
      queueSessionId,
      queueEntryId,
    };
  }

  private async recipients(
    tx: Prisma.TransactionClient,
    event: ReturnType<NotificationOutboxWorker['validate']>,
  ): Promise<Recipient[]> {
    const session = await tx.queueSession.findFirst({
      where: {
        id: event.queueSessionId,
        organizationId: event.organizationId,
        clinicId: event.clinicId,
        organization: { status: 'active' },
        clinic: { status: 'active' },
      },
      select: {
        doctorAssignment: {
          select: {
            status: true,
            doctor: {
              select: {
                status: true,
                staffAccount: {
                  select: { user: { select: { id: true, status: true } } },
                },
              },
            },
          },
        },
      },
    });
    if (!session) throw new Error('SOURCE_SCOPE_NOT_FOUND');
    const recipients = new Map<string, Recipient>();
    const doctorUser = session.doctorAssignment.doctor.staffAccount.user;
    if (
      session.doctorAssignment.status === 'active' &&
      session.doctorAssignment.doctor.status === 'active' &&
      doctorUser.status === 'active' &&
      !(await this.isPlatformAdministrator(tx, doctorUser.id))
    )
      recipients.set(doctorUser.id, {
        userId: doctorUser.id,
        patientProfileId: null,
      });

    const memberships = await tx.clinicMembership.findMany({
      where: {
        organizationId: event.organizationId,
        clinicId: event.clinicId,
        status: 'active',
        role: { in: ['receptionist', 'clinicManager'] },
        user: {
          status: 'active',
          staffAccount: { isNot: null },
        },
        NOT: {
          user: { roles: { some: { role: 'platformAdministrator' } } },
        },
        organization: { status: 'active' },
        clinic: { status: 'active' },
      },
      select: { userId: true },
    });
    for (const membership of memberships)
      recipients.set(membership.userId, {
        userId: membership.userId,
        patientProfileId: null,
      });

    const entries = await tx.queueEntry.findMany({
      where: {
        organizationId: event.organizationId,
        clinicId: event.clinicId,
        queueSessionId: event.queueSessionId,
        ...(event.queueEntryId
          ? { id: event.queueEntryId }
          : { status: { in: ['waiting', 'called', 'inConsultation'] } }),
        patientRegistration: {
          status: 'active',
          patientProfile: {
            status: 'active',
            patientAccount: {
              user: {
                status: 'active',
                roles: { none: { role: 'platformAdministrator' } },
              },
            },
          },
        },
      },
      select: {
        patientProfileId: true,
        patientRegistration: {
          select: {
            patientProfile: {
              select: { patientAccount: { select: { userId: true } } },
            },
          },
        },
      },
    });
    for (const entry of entries) {
      const userId =
        entry.patientRegistration.patientProfile.patientAccount.userId;
      recipients.set(userId, {
        userId,
        patientProfileId: entry.patientProfileId,
      });
    }
    return [...recipients.values()].sort((a, b) =>
      a.userId.localeCompare(b.userId),
    );
  }

  private async isPlatformAdministrator(
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<boolean> {
    return Boolean(
      await tx.identityRoleAssignment.findFirst({
        where: { userId, role: 'platformAdministrator' },
        select: { id: true },
      }),
    );
  }

  private async recordFailure(event: LockedOutboxEvent): Promise<void> {
    const attempts = event.attempts + 1;
    const terminal =
      attempts >= this.configuration.notificationWorkerMaxAttempts;
    const exponential =
      this.configuration.notificationWorkerRetryBaseMs *
      2 ** Math.min(attempts - 1, 20);
    const bounded = Math.min(
      exponential,
      this.configuration.notificationWorkerRetryMaxMs,
    );
    const delay = Math.floor(bounded * (0.75 + Math.random() * 0.5));
    await this.prisma.db.outboxEvent.updateMany({
      where: {
        id: event.id,
        publishedAt: null,
        failedAt: null,
        attempts: event.attempts,
      },
      data: {
        attempts,
        nextAttemptAt: terminal ? null : new Date(Date.now() + delay),
        failedAt: terminal ? new Date() : null,
        lastErrorCode: terminal ? 'PROJECTION_TERMINAL' : 'PROJECTION_RETRY',
      },
    });
    this.logger.warn({
      sourceOutboxId: event.id,
      eventType: event.eventType,
      attempt: attempts,
      outcomeCode: terminal ? 'PROJECTION_TERMINAL' : 'PROJECTION_RETRY',
    });
  }

  private priority(eventType: QueueNotificationEvent): NotificationPriority {
    if (
      eventType === 'queue.patient.called' ||
      eventType === 'queue.patient.recalled'
    )
      return 'high';
    if (
      eventType === 'queue.session.opened' ||
      eventType === 'queue.entry.enqueued'
    )
      return 'information';
    return 'normal';
  }

  private safeErrorCode(error: unknown): string {
    const codes: string[] = [];
    const collect = (value: unknown, depth: number) => {
      if (!value || typeof value !== 'object' || depth > 3) return;
      for (const [key, nested] of Object.entries(value)) {
        if (key === 'code') codes.push(String(nested));
        else collect(nested, depth + 1);
      }
    };
    collect(error, 0);
    const code =
      codes.find((candidate) => /^\d[0-9A-Z]{4}$/.test(candidate)) ??
      codes.find((candidate) => /^[A-Z0-9_]{1,32}$/.test(candidate)) ??
      '';
    return /^[A-Z0-9_]{1,32}$/.test(code) ? code : 'PROJECTION_FAILED';
  }

  private uuid(value: unknown): string {
    if (
      typeof value !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      )
    )
      throw new Error('INVALID_EVENT_PAYLOAD');
    return value;
  }

  private delay(milliseconds: number): Promise<void> {
    if (this.abortController.signal.aborted) return Promise.resolve();
    return new Promise((resolve) => {
      const onAbort = () => {
        clearTimeout(timer);
        resolve();
      };
      const timer = setTimeout(() => {
        this.abortController.signal.removeEventListener('abort', onAbort);
        resolve();
      }, milliseconds);
      this.abortController.signal.addEventListener('abort', onAbort, {
        once: true,
      });
    });
  }
}
