/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { App } from 'supertest/types';
import {
  apiPrisma,
  apiSideEffects,
  createApiTenant,
  createQueueApiApplication,
  createRolePrincipal,
  expectErrorEnvelope,
} from './live-queue-api-fixture';

describe('live queue HTTP validation certification', () => {
  let app: INestApplication<App>;
  let token: string;
  let sessionId: string;

  beforeAll(async () => {
    app = await createQueueApiApplication();
    const tenant = await createApiTenant('contract');
    token = (await createRolePrincipal('clinicManager', tenant)).token;
    sessionId = randomUUID();
  });

  afterAll(async () => {
    await app.close();
    await apiPrisma.$disconnect();
  });

  const invalidBodies: ReadonlyArray<{
    name: string;
    body?: object;
    key?: string;
  }> = [
    { name: 'missing body' },
    { name: 'unknown field', body: { version: 1, surprise: true } },
    { name: 'missing expected version', body: {} },
    { name: 'zero version', body: { version: 0 } },
    { name: 'negative version', body: { version: -1 } },
    { name: 'decimal version', body: { version: 1.5 } },
    { name: 'string version', body: { version: '1' } },
    { name: 'missing idempotency key', body: { version: 1 }, key: '' },
    { name: 'empty idempotency key', body: { version: 1 }, key: '' },
    { name: 'whitespace key', body: { version: 1 }, key: '        ' },
    { name: 'too-short key', body: { version: 1 }, key: 'short' },
    {
      name: 'oversized key',
      body: { version: 1 },
      key: 'x'.repeat(129),
    },
    {
      name: 'conflicting duplicate keys',
      body: { version: 1 },
      key: 'first-key, second-key',
    },
  ];

  it.each(invalidBodies)(
    'rejects $name with 400 and no effects',
    async (test) => {
      const before = await apiSideEffects();
      let pending = request(app.getHttpServer())
        .post(`/api/v1/queue-sessions/${sessionId}/pause`)
        .set('Authorization', `Bearer ${token}`);
      if (test.key !== undefined)
        pending = pending.set('Idempotency-Key', test.key);
      const response =
        test.body === undefined ? await pending : await pending.send(test.body);
      expect(response.status).toBe(400);
      expectErrorEnvelope(response.body, 400);
      expect(await apiSideEffects()).toEqual(before);
    },
  );

  it('rejects invalid UUID route parameters before repository access', async () => {
    const before = await apiSideEffects();
    const response = await request(app.getHttpServer())
      .post('/api/v1/queue-sessions/not-a-uuid/pause')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', 'invalid-uuid')
      .send({ version: 1 });
    expect(response.status).toBe(400);
    expectErrorEnvelope(response.body, 400);
    expect(await apiSideEffects()).toEqual(before);
  });

  it('returns the standard envelope for malformed JSON', async () => {
    const before = await apiSideEffects();
    const response = await request(app.getHttpServer())
      .post(`/api/v1/queue-sessions/${sessionId}/pause`)
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', 'malformed-json')
      .set('Content-Type', 'application/json')
      .send('{"version":');
    expect(response.status).toBe(400);
    expectErrorEnvelope(response.body, 400);
    expect(await apiSideEffects()).toEqual(before);
  });

  it.each([0, -1, 101])(
    'rejects page size %s with 400 and no effects',
    async (pageSize) => {
      const before = await apiSideEffects();
      const response = await request(app.getHttpServer())
        .get(`/api/v1/queue-sessions/${sessionId}/entries`)
        .query({ pageSize })
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(400);
      expectErrorEnvelope(response.body, 400);
      expect(await apiSideEffects()).toEqual(before);
    },
  );

  it.each(['terminal', '1', 'yes'])(
    'rejects unsupported terminal filter %s',
    async (includeTerminal) => {
      const before = await apiSideEffects();
      const response = await request(app.getHttpServer())
        .get(`/api/v1/queue-sessions/${sessionId}/entries`)
        .query({ includeTerminal })
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(400);
      expectErrorEnvelope(response.body, 400);
      expect(await apiSideEffects()).toEqual(before);
    },
  );

  it('rejects an oversized pause reason and unsupported fields', async () => {
    const before = await apiSideEffects();
    for (const body of [
      { version: 1, reason: 'x'.repeat(241) },
      { version: 1, status: 'paused' },
    ]) {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/queue-sessions/${sessionId}/pause`)
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', `pause-validation-${randomUUID()}`)
        .send(body);
      expect(response.status).toBe(400);
      expectErrorEnvelope(response.body, 400);
    }
    expect(await apiSideEffects()).toEqual(before);
  });
});
