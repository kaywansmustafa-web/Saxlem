export interface IdempotencyClaim {
  readonly actorId: string;
  readonly scope: string;
  readonly key: string;
  readonly requestHash: string;
}

export interface IdempotencyStore {
  claim(input: IdempotencyClaim): Promise<'claimed' | 'replayed' | 'conflict'>;
}

export const IDEMPOTENCY_STORE = Symbol('IDEMPOTENCY_STORE');
