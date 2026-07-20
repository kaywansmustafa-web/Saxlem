import { Injectable } from '@nestjs/common';
import type { RateLimitAction, RateLimitBoundary } from '../domain/providers';

interface Bucket {
  count: number;
  resetsAt: number;
}

const limits: Record<RateLimitAction, { maximum: number; windowMs: number }> = {
  otpRequest: { maximum: 3, windowMs: 15 * 60_000 },
  otpVerify: { maximum: 5, windowMs: 5 * 60_000 },
  login: { maximum: 10, windowMs: 15 * 60_000 },
  refresh: { maximum: 30, windowMs: 5 * 60_000 },
  logout: { maximum: 30, windowMs: 5 * 60_000 },
  logoutAll: { maximum: 10, windowMs: 5 * 60_000 },
};

@Injectable()
export class InMemoryRateLimiter implements RateLimitBoundary {
  private readonly buckets = new Map<string, Bucket>();
  private operations = 0;

  consume(
    key: string,
    action: RateLimitAction,
    dimension: 'subject' | 'network' = 'subject',
  ): Promise<boolean> {
    const now = Date.now();
    this.operations += 1;
    if (this.operations % 100 === 0) this.prune(now);
    const id = `${action}:${dimension}:${key}`;
    const base = limits[action];
    const policy =
      dimension === 'network'
        ? { maximum: base.maximum * 20, windowMs: base.windowMs }
        : base;
    let bucket = this.buckets.get(id);
    if (!bucket || bucket.resetsAt <= now) {
      bucket = { count: 0, resetsAt: now + policy.windowMs };
      this.buckets.set(id, bucket);
    }
    bucket.count += 1;
    return Promise.resolve(bucket.count <= policy.maximum);
  }

  private prune(now: number): void {
    for (const [key, bucket] of this.buckets)
      if (bucket.resetsAt <= now) this.buckets.delete(key);
    if (this.buckets.size > 10_000) {
      const overflow = this.buckets.size - 10_000;
      for (const key of Array.from(this.buckets.keys()).slice(0, overflow))
        this.buckets.delete(key);
    }
  }
}
