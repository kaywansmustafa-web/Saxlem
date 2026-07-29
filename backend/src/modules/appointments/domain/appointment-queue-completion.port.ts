import type { Prisma } from '@prisma/client';

export interface CompleteAppointmentFromQueueInput {
  readonly appointmentId: string;
  readonly expectedVersion: number;
  readonly queueSessionId: string;
  readonly queueEntryId: string;
  readonly actorUserId: string;
  readonly requestId: string;
  readonly occurredAt: Date;
}

export interface AppointmentQueueCompletionPort {
  completeFromQueue(
    tx: Prisma.TransactionClient,
    input: CompleteAppointmentFromQueueInput,
  ): Promise<void>;
}

export const APPOINTMENT_QUEUE_COMPLETION_PORT = Symbol(
  'APPOINTMENT_QUEUE_COMPLETION_PORT',
);
