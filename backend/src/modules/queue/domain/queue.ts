import type { AppointmentAccess } from '../../appointments/domain/appointment';

export type QueueAccess = AppointmentAccess & {
  readonly capabilities: ReadonlySet<string>;
};
export type QueueSessionState = 'notStarted' | 'open' | 'paused' | 'closed';
export type QueueEntryState =
  | 'waiting'
  | 'called'
  | 'inConsultation'
  | 'completed'
  | 'noResponse'
  | 'removed';
export type QueueHealth = 'healthy' | 'busy' | 'delayed';

export interface QueueCommand {
  readonly key: string;
  readonly scope: string;
  readonly hash: string;
}
export interface QueueEntryProjection {
  readonly id: string;
  readonly queueSessionId: string;
  readonly appointmentId: string;
  readonly appointmentReference: string;
  readonly patientProfileId: string;
  readonly patientName: string;
  readonly ticketNumber: number;
  readonly status: QueueEntryState;
  readonly version: number;
  readonly enqueuedAt: string;
  readonly calledAt: string | null;
  readonly consultationStartedAt: string | null;
  readonly completedAt: string | null;
  readonly noResponseAt: string | null;
}
export interface QueueEnqueueResult extends QueueSnapshot {
  readonly enqueuedEntry: QueueEntryProjection;
}
export interface QueueSnapshot {
  readonly id: string;
  readonly organizationId: string;
  readonly clinic: { readonly id: string; readonly name: string };
  readonly doctor: { readonly id: string; readonly name: string };
  readonly operationalDate: string;
  readonly effectiveTimezone: string;
  readonly status: QueueSessionState;
  readonly version: number;
  readonly waitingCount: number;
  readonly current: QueueEntryProjection | null;
  readonly waiting: readonly QueueEntryProjection[];
  readonly recentActivity: readonly {
    action: string;
    occurredAt: string;
    ticketNumber: number | null;
  }[];
  readonly openedAt: string | null;
  readonly pausedAt: string | null;
  readonly closedAt: string | null;
  readonly pauseReason: string | null;
  readonly updatedAt: string;
}
export interface QueueEntryPage {
  readonly items: readonly QueueEntryProjection[];
  readonly nextCursor: string | null;
}
export interface PatientQueueStatus {
  readonly queueState: QueueSessionState;
  readonly ticketNumber: number;
  readonly currentTicket: number | null;
  readonly patientsAhead: number;
  readonly estimatedWait: {
    readonly minimumMinutes: number;
    readonly maximumMinutes: number;
  } | null;
  readonly estimateSuspended: boolean;
  readonly queueHealth: QueueHealth;
  readonly doctor: { readonly id: string; readonly name: string };
  readonly clinic: { readonly id: string; readonly name: string };
  readonly appointmentReference: string;
  readonly status: QueueEntryState;
  readonly instruction: string;
  readonly lastUpdatedAt: string;
}
export interface QueuePolicy {
  readonly recallGraceMinutes: number;
  readonly busyThresholdMinutes: number;
  readonly delayedThresholdMinutes: number;
  readonly fallbackConsultationMinutes: number;
}

const sessionTransitions: Record<
  QueueSessionState,
  readonly QueueSessionState[]
> = {
  notStarted: ['open'],
  open: ['paused', 'closed'],
  paused: ['open', 'closed'],
  closed: [],
};
const entryTransitions: Record<QueueEntryState, readonly QueueEntryState[]> = {
  waiting: ['called'],
  called: ['inConsultation', 'noResponse'],
  noResponse: ['called'],
  inConsultation: ['completed'],
  completed: [],
  removed: [],
};

export function canTransitionSession(
  from: QueueSessionState,
  to: QueueSessionState,
): boolean {
  return sessionTransitions[from].includes(to);
}
export function canTransitionEntry(
  from: QueueEntryState,
  to: QueueEntryState,
): boolean {
  return entryTransitions[from].includes(to);
}
export function deriveQueueHealth(
  behindMinutes: number,
  policy: QueuePolicy,
): QueueHealth {
  if (!Number.isFinite(behindMinutes)) return 'delayed';
  behindMinutes = Math.max(0, behindMinutes);
  if (behindMinutes <= policy.busyThresholdMinutes) return 'healthy';
  if (behindMinutes <= policy.delayedThresholdMinutes) return 'busy';
  return 'delayed';
}
export function deriveWaitRange(
  waitingPatientsAhead: number,
  averageMinutes: number,
  currentRemainingMinutes: number,
): { minimumMinutes: number; maximumMinutes: number } {
  const ahead =
    Number.isFinite(waitingPatientsAhead) && waitingPatientsAhead > 0
      ? Math.floor(waitingPatientsAhead)
      : 0;
  const average =
    Number.isFinite(averageMinutes) && averageMinutes > 0
      ? Math.min(480, averageMinutes)
      : 1;
  const remaining =
    Number.isFinite(currentRemainingMinutes) && currentRemainingMinutes > 0
      ? Math.min(480, currentRemainingMinutes)
      : 0;
  const estimate = remaining + Math.min(10_000, ahead) * average;
  const round = (value: number) =>
    Math.min(1440, Math.max(0, Math.ceil(value / 5) * 5));
  return {
    minimumMinutes: round(estimate * 0.8),
    maximumMinutes: round(estimate * 1.2),
  };
}
export function isRecallAllowed(
  noResponseAt: Date,
  now: Date,
  graceMinutes: number,
): boolean {
  return (
    Number.isFinite(noResponseAt.getTime()) &&
    now.getTime() <= noResponseAt.getTime() + graceMinutes * 60_000
  );
}
