export const SUPPORTED_QUEUE_NOTIFICATION_EVENTS = [
  'queue.session.opened',
  'queue.session.paused',
  'queue.session.resumed',
  'queue.session.closed',
  'queue.entry.enqueued',
  'queue.patient.called',
  'queue.patient.recalled',
  'queue.patient.no-response',
  'queue.consultation.started',
  'queue.consultation.completed',
] as const;

export type QueueNotificationEvent =
  (typeof SUPPORTED_QUEUE_NOTIFICATION_EVENTS)[number];

export interface NotificationAccess {
  readonly actorId: string;
  readonly sessionId: string;
  readonly patient: boolean;
  readonly organizationId?: string;
  readonly clinicId?: string;
}

export interface NotificationProjection {
  readonly id: string;
  readonly patientProfileId: string | null;
  readonly sequence: bigint;
  readonly type: string;
  readonly priority: 'high' | 'normal' | 'information';
  readonly actionCode: string;
  readonly occurredAt: Date;
  readonly createdAt: Date;
  readonly readAt: Date | null;
}

export interface NotificationPage {
  readonly items: readonly NotificationProjection[];
  readonly nextSequence: bigint | null;
}
