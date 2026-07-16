import type { LiveQueue, QueueOperation } from "./models";

export interface QueueCommand {
  queueId: string;
  operation: QueueOperation;
  expectedVersion: number;
  operationId: string;
  occurredAt: string;
}

export interface QueueRepositoryResult { queue: LiveQueue; idempotent: boolean }

export interface LiveQueueRepository {
  get(queueId: string): Promise<LiveQueue | null>;
  apply(command: QueueCommand): Promise<QueueRepositoryResult>;
}
