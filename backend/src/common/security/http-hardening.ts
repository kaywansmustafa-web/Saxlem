import { createHash } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { PRODUCT_API_PREFIX } from '../api/api.constants';

interface HardeningOptions {
  trustProxyHops: number;
  apiRateLimitPerMinute: number;
}

/**
 * Transport-level protections for every response: security headers, no
 * framework fingerprint, the real client address behind a load balancer and a
 * per-address request budget so one machine cannot flood the API.
 */
export function applyHttpHardening(
  app: INestApplication,
  options: HardeningOptions,
): void {
  const express = app.getHttpAdapter().getInstance() as {
    disable(setting: string): void;
    set(setting: string, value: unknown): void;
  };
  express.disable('x-powered-by');
  if (options.trustProxyHops > 0)
    express.set('trust proxy', options.trustProxyHops);
  const docs = `/${PRODUCT_API_PREFIX}/docs`;
  const strict = helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
    },
    crossOriginResourcePolicy: { policy: 'same-site' },
    referrerPolicy: { policy: 'no-referrer' },
    strictTransportSecurity: { maxAge: 63_072_000, includeSubDomains: true },
  });
  const forDocs = helmet({ contentSecurityPolicy: false });
  app.use((request: Request, response: Response, next: NextFunction) =>
    (request.path.startsWith(docs) ? forDocs : strict)(request, response, next),
  );
  if (options.apiRateLimitPerMinute > 0)
    app.use(requestBudget(options.apiRateLimitPerMinute));
}

interface Bucket {
  all: number;
  writes: number;
  resetsAt: number;
}

/**
 * Fixed one-minute window; writes get a fifth of the budget. Signed-in calls
 * are budgeted per user (the portals call the API from one server address for
 * every clinic, and mobile carriers put many patients behind one address);
 * anonymous calls per address.
 */
export function requestBudget(perMinute: number, now = () => Date.now()) {
  const buckets = new Map<string, Bucket>();
  const writeBudget = Math.max(1, Math.floor(perMinute / 5));
  let seen = 0;
  return (request: Request, response: Response, next: NextFunction): void => {
    if (request.path.startsWith('/health/')) return next();
    const time = now();
    if (++seen % 500 === 0)
      for (const [key, bucket] of buckets)
        if (bucket.resetsAt <= time) buckets.delete(key);
    const key = budgetKey(request);
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetsAt <= time) {
      bucket = { all: 0, writes: 0, resetsAt: time + 60_000 };
      buckets.set(key, bucket);
    }
    bucket.all += 1;
    if (request.method !== 'GET' && request.method !== 'HEAD')
      bucket.writes += 1;
    if (bucket.all > perMinute || bucket.writes > writeBudget) {
      response.setHeader(
        'Retry-After',
        String(Math.ceil((bucket.resetsAt - time) / 1000)),
      );
      response.status(429).json({
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please wait a moment and try again.',
          requestId: 'unavailable',
          retryable: true,
          fieldErrors: [],
        },
      });
      return;
    }
    next();
  };
}

function budgetKey(request: Request): string {
  const authorization = request.headers.authorization;
  if (typeof authorization === 'string' && authorization.startsWith('Bearer '))
    return `user:${createHash('sha256').update(authorization).digest('base64url').slice(0, 22)}`;
  return `ip:${request.ip ?? request.socket.remoteAddress ?? 'unknown'}`;
}
