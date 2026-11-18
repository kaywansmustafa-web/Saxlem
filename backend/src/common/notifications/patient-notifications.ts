import type { NotificationPriority, Prisma } from '@prisma/client';

/** Notifications a patient receives about a visit, beyond the live queue. */
export const PATIENT_APPOINTMENT_NOTIFICATIONS = [
  'appointment.booked',
  'appointment.cancelled.by-clinic',
  'appointment.rescheduled.by-clinic',
  'appointment.reminder.day-before',
  'appointment.reminder.soon',
  'queue.patient.almost',
] as const;
export type PatientAppointmentNotification =
  (typeof PATIENT_APPOINTMENT_NOTIFICATIONS)[number];

/** What the app may show with a notification. Never contact or medical details. */
export interface PatientNotificationContext {
  readonly appointmentId?: string;
  readonly doctorName?: string;
  readonly clinicName?: string;
  readonly startsAt?: string;
  readonly ticketNumber?: number;
  readonly ahead?: number;
}

const CONTEXT_KEYS = [
  'appointmentId',
  'doctorName',
  'clinicName',
  'startsAt',
  'ticketNumber',
  'ahead',
] as const;

/** Reads a stored context back, keeping only known, well-formed fields. */
export function readNotificationContext(
  payload: unknown,
): PatientNotificationContext | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload))
    return null;
  const raw = (payload as Record<string, unknown>).context;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const source = raw as Record<string, unknown>;
  const context: Record<string, string | number> = {};
  for (const key of CONTEXT_KEYS) {
    const value = source[key];
    if (key === 'ticketNumber' || key === 'ahead') {
      if (Number.isInteger(value) && (value as number) >= 0)
        context[key] = value as number;
    } else if (
      typeof value === 'string' &&
      value.length > 0 &&
      value.length <= 200
    )
      context[key] = value;
  }
  return Object.keys(context).length ? context : null;
}

export interface PatientNotificationInput {
  readonly organizationId: string;
  readonly clinicId: string;
  readonly patientProfileId: string;
  readonly type: PatientAppointmentNotification;
  /** The appointment or queue entry the notification is about. */
  readonly aggregateType: 'appointment' | 'queueEntry';
  readonly aggregateId: string;
  readonly priority?: NotificationPriority;
  readonly context: PatientNotificationContext;
  readonly occurredAt?: Date;
  /** Skip when this notification was already sent for the same aggregate. */
  readonly once?: boolean;
}

/**
 * Records a notification for the patient's app account, in the caller's
 * transaction. Patients a clinic registered without the app have no account
 * and are skipped. Returns whether a notification was written.
 */
export async function notifyPatient(
  tx: Prisma.TransactionClient,
  input: PatientNotificationInput,
): Promise<boolean> {
  const profile = await tx.patientProfile.findUnique({
    where: { id: input.patientProfileId },
    select: {
      status: true,
      patientAccount: {
        select: { userId: true, user: { select: { status: true } } },
      },
    },
  });
  const account = profile?.patientAccount;
  if (
    !account ||
    profile.status !== 'active' ||
    account.user.status !== 'active'
  )
    return false;
  if (input.once) {
    const existing = await tx.outboxEvent.findFirst({
      where: { aggregateId: input.aggregateId, eventType: input.type },
      select: { id: true },
    });
    if (existing) return false;
  }
  const occurredAt = input.occurredAt ?? new Date();
  // Published at once: the queue projector only picks up queue events.
  const event = await tx.outboxEvent.create({
    data: {
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      eventType: input.type,
      payload: {
        organizationId: input.organizationId,
        clinicId: input.clinicId,
      },
      occurredAt,
      publishedAt: occurredAt,
    },
    select: { id: true },
  });
  await tx.notificationRecord.create({
    data: {
      sourceOutboxEventId: event.id,
      organizationId: input.organizationId,
      clinicId: input.clinicId,
      recipientUserId: account.userId,
      patientProfileId: input.patientProfileId,
      type: input.type,
      priority: input.priority ?? 'normal',
      payload: {
        actionCode: input.type,
        context: { ...input.context },
      },
      occurredAt,
    },
  });
  return true;
}
