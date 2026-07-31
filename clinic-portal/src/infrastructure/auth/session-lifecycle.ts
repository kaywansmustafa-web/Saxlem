import "server-only";

/** Serializes lifecycle mutations for one backend session within this portal instance. */
class SessionLifecycleCoordinator {
  private readonly tails = new Map<string, Promise<void>>();
  private readonly refreshes = new Map<string, Promise<unknown>>();

  singleFlight<T>(key: string, operation: () => Promise<T>): Promise<T> {
    const existing = this.refreshes.get(key) as Promise<T> | undefined;
    if (existing) return existing;
    const pending = operation().finally(() => {
      if (this.refreshes.get(key) === pending) this.refreshes.delete(key);
    });
    this.refreshes.set(key, pending);
    return pending;
  }

  async run<T>(sessionId: string, operation: () => Promise<T>): Promise<T> {
    const previous = this.tails.get(sessionId) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    const tail = previous.catch(() => undefined).then(() => current);
    this.tails.set(sessionId, tail);
    await previous.catch(() => undefined);
    try {
      return await operation();
    } finally {
      release();
      if (this.tails.get(sessionId) === tail) this.tails.delete(sessionId);
    }
  }
}

export const sessionLifecycle = new SessionLifecycleCoordinator();
