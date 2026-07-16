export interface OutboxMessage {
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly eventType: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly occurredAt: Date;
}

export interface OutboxWriter {
  append(message: OutboxMessage): Promise<void>;
}

export const OUTBOX_WRITER = Symbol('OUTBOX_WRITER');
