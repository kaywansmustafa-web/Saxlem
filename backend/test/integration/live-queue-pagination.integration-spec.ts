/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { App } from 'supertest/types';
import {
  apiPrisma,
  createQueueApiApplication,
  createSeededQueue,
  expectErrorEnvelope,
} from './live-queue-api-fixture';

describe('live queue HTTP pagination certification', () => {
  let app: INestApplication<App>;
  let fixture: Awaited<ReturnType<typeof createSeededQueue>>;

  beforeAll(async () => {
    app = await createQueueApiApplication();
    fixture = await createSeededQueue(151);
  }, 30_000);

  afterAll(async () => {
    await app.close();
    await apiPrisma.$disconnect();
  });

  it('uses 25 by default and supports exact sizes 1 and 100', async () => {
    for (const [pageSize, expected] of [
      [undefined, 25],
      [1, 1],
      [100, 100],
    ] as const) {
      let pending = request(app.getHttpServer())
        .get(`/api/v1/queue-sessions/${fixture.session.id}/entries`)
        .set('Authorization', `Bearer ${fixture.manager.token}`);
      if (pageSize !== undefined) pending = pending.query({ pageSize });
      const response = await pending;
      expect(response.status).toBe(200);
      expect(Object.keys(response.body).sort()).toEqual([
        'items',
        'nextCursor',
      ]);
      expect(response.body.items).toHaveLength(expected);
      expect(response.body.nextCursor).toEqual(expect.any(String));
    }
  });

  it('walks all 151 entries in stable ticket order without duplicates or omissions', async () => {
    const entries: Array<{
      ticketNumber: number;
      entryId: string;
    }> = [];
    let cursor: string | undefined;
    do {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/queue-sessions/${fixture.session.id}/entries`)
        .query({ pageSize: 25, ...(cursor ? { cursor } : {}) })
        .set('Authorization', `Bearer ${fixture.manager.token}`);
      expect(response.status).toBe(200);
      entries.push(...response.body.items);
      cursor = response.body.nextCursor ?? undefined;
    } while (cursor);
    expect(entries).toHaveLength(151);
    expect(new Set(entries.map((entry) => entry.entryId)).size).toBe(151);
    expect(entries.map((entry) => entry.ticketNumber)).toEqual(
      Array.from({ length: 151 }, (_, index) => index + 1),
    );
  });

  it('rejects structurally valid payload, signature, and session tampering', async () => {
    const first = await request(app.getHttpServer())
      .get(`/api/v1/queue-sessions/${fixture.session.id}/entries`)
      .query({ pageSize: 1 })
      .set('Authorization', `Bearer ${fixture.manager.token}`);
    const cursor = first.body.nextCursor as string;
    const [payload, signature] = cursor.split('.');
    const parsed = JSON.parse(
      Buffer.from(payload!, 'base64url').toString('utf8'),
    ) as { sessionId: string; ticketNumber: number; id: string };
    const withPayload = (value: typeof parsed) =>
      `${Buffer.from(JSON.stringify(value)).toString('base64url')}.${signature}`;
    const differentId =
      parsed.id === '00000000-0000-0000-0000-000000000001'
        ? '00000000-0000-0000-0000-000000000002'
        : '00000000-0000-0000-0000-000000000001';
    const cursors = [
      'not-a-cursor',
      withPayload({ ...parsed, ticketNumber: parsed.ticketNumber + 1 }),
      withPayload({ ...parsed, id: differentId }),
      `${payload}.${signature![0] === '0' ? '1' : '0'}${signature!.slice(1)}`,
      withPayload({ ...parsed, sessionId: randomUUID() }),
    ];
    for (const cursor of cursors) {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/queue-sessions/${fixture.session.id}/entries`)
        .query({ cursor })
        .set('Authorization', `Bearer ${fixture.manager.token}`);
      expect(response.status).toBe(400);
      expectErrorEnvelope(response.body, 400);
    }
  });

  it('accepts an unmodified authenticated cursor', async () => {
    const first = await request(app.getHttpServer())
      .get(`/api/v1/queue-sessions/${fixture.session.id}/entries`)
      .query({ pageSize: 1 })
      .set('Authorization', `Bearer ${fixture.manager.token}`);
    const second = await request(app.getHttpServer())
      .get(`/api/v1/queue-sessions/${fixture.session.id}/entries`)
      .query({ pageSize: 1, cursor: first.body.nextCursor })
      .set('Authorization', `Bearer ${fixture.manager.token}`);
    expect(second.status).toBe(200);
    expect(second.body.items).toHaveLength(1);
    expect(second.body.items[0].ticketNumber).toBe(2);
  });

  it('rejects a valid signed cursor issued for another session', async () => {
    const foreign = await createSeededQueue(2);
    const foreignPage = await request(app.getHttpServer())
      .get(`/api/v1/queue-sessions/${foreign.session.id}/entries`)
      .query({ pageSize: 1 })
      .set('Authorization', `Bearer ${foreign.manager.token}`);
    const response = await request(app.getHttpServer())
      .get(`/api/v1/queue-sessions/${fixture.session.id}/entries`)
      .query({ cursor: foreignPage.body.nextCursor })
      .set('Authorization', `Bearer ${fixture.manager.token}`);
    expect(response.status).toBe(400);
    expectErrorEnvelope(response.body, 400);
  });

  it('preserves access control on every page for manager, doctor, and patient', async () => {
    for (const token of [fixture.manager.token, fixture.doctor.token]) {
      let cursor: string | undefined;
      let count = 0;
      do {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/queue-sessions/${fixture.session.id}/entries`)
          .query({ pageSize: 100, ...(cursor ? { cursor } : {}) })
          .set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(200);
        count += response.body.items.length;
        cursor = response.body.nextCursor ?? undefined;
      } while (cursor);
      expect(count).toBe(151);
    }
    const patientResponse = await request(app.getHttpServer())
      .get(`/api/v1/queue-sessions/${fixture.session.id}/entries`)
      .set('Authorization', `Bearer ${fixture.patient.token}`);
    expect(patientResponse.status).toBe(403);
    expectErrorEnvelope(patientResponse.body, 403);
  });

  it('privacy-hides every page from a doctor in another clinic', async () => {
    const foreign = await createSeededQueue(1);
    const response = await request(app.getHttpServer())
      .get(`/api/v1/queue-sessions/${fixture.session.id}/entries`)
      .set('Authorization', `Bearer ${foreign.doctor.token}`);
    expect(response.status).toBe(404);
    expectErrorEnvelope(response.body, 404);
  });

  it('keeps cursor ordering valid after a status change and excludes terminal rows by default', async () => {
    const first = await request(app.getHttpServer())
      .get(`/api/v1/queue-sessions/${fixture.session.id}/entries`)
      .query({ pageSize: 1 })
      .set('Authorization', `Bearer ${fixture.manager.token}`);
    let version = fixture.session.version;
    let response = await command('call-next', { version }, version);
    version = response.body.version;
    const current = response.body.currentPatient;
    response = await entryCommand(
      current,
      'start-consultation',
      version,
      current.version,
    );
    version = response.body.version;
    response = await entryCommand(
      response.body.currentPatient,
      'complete-consultation',
      version,
      response.body.currentPatient.version,
    );
    expect(response.status).toBe(200);

    const afterCursor = await request(app.getHttpServer())
      .get(`/api/v1/queue-sessions/${fixture.session.id}/entries`)
      .query({ pageSize: 100, cursor: first.body.nextCursor })
      .set('Authorization', `Bearer ${fixture.manager.token}`);
    expect(afterCursor.status).toBe(200);
    expect(afterCursor.body.items[0].ticketNumber).toBe(2);

    const defaultPage = await request(app.getHttpServer())
      .get(`/api/v1/queue-sessions/${fixture.session.id}/entries`)
      .query({ pageSize: 100 })
      .set('Authorization', `Bearer ${fixture.manager.token}`);
    expect(
      defaultPage.body.items.some(
        (item: { ticketNumber: number }) => item.ticketNumber === 1,
      ),
    ).toBe(false);
    const terminalPage = await request(app.getHttpServer())
      .get(`/api/v1/queue-sessions/${fixture.session.id}/entries`)
      .query({ pageSize: 100, includeTerminal: true })
      .set('Authorization', `Bearer ${fixture.manager.token}`);
    expect(
      terminalPage.body.items.some(
        (item: { ticketNumber: number }) => item.ticketNumber === 1,
      ),
    ).toBe(true);
  });

  function command(operation: string, body: object, suffix: number) {
    return request(app.getHttpServer())
      .post(`/api/v1/queue-sessions/${fixture.session.id}/${operation}`)
      .set('Authorization', `Bearer ${fixture.manager.token}`)
      .set('Idempotency-Key', `${operation}-${suffix}-${randomUUID()}`)
      .send(body);
  }

  function entryCommand(
    entry: { version: number },
    operation: string,
    sessionVersion: number,
    entryVersion: number,
  ) {
    const entryId = fixture.session.id;
    return apiPrisma.queueEntry
      .findFirstOrThrow({
        where: {
          queueSessionId: fixture.session.id,
          ticketNumber: 1,
        },
      })
      .then((row) =>
        request(app.getHttpServer())
          .post(
            `/api/v1/queue-sessions/${fixture.session.id}/entries/${row.id}/${operation}`,
          )
          .set('Authorization', `Bearer ${fixture.manager.token}`)
          .set('Idempotency-Key', `${operation}-${entryId}-${randomUUID()}`)
          .send({
            sessionVersion,
            entryVersion: entry.version ?? entryVersion,
          }),
      );
  }
});
