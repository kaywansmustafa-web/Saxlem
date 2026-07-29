/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { App } from 'supertest/types';
import {
  apiPrisma,
  createApiTenant,
  createQueueApiApplication,
  createRolePrincipal,
  createSeededQueue,
  expectErrorEnvelope,
} from './live-queue-api-fixture';

describe('live queue public lifecycle certification', () => {
  let app: INestApplication<App>;
  let fixture: Awaited<ReturnType<typeof createSeededQueue>>;

  beforeAll(async () => {
    app = await createQueueApiApplication();
    fixture = await createSeededQueue(3);
  });

  afterAll(async () => {
    await app.close();
    await apiPrisma.$disconnect();
  });

  it('rejects pause, resume, and close before open with no effects', async () => {
    const session = await apiPrisma.queueSession.create({
      data: {
        organizationId: fixture.tenant.organizationId,
        clinicId: fixture.tenant.clinicId,
        doctorId: fixture.doctor.doctorId!,
        operationalDate: new Date('2035-01-02'),
      },
    });
    for (const operation of ['pause', 'resume', 'close']) {
      await expectConflict(
        session.id,
        operation,
        { version: 1 },
        `before-open-${operation}`,
      );
    }
  });

  it('rejects waiting-entry transitions and unresolved close', async () => {
    const entry = await firstEntry('waiting');
    for (const operation of [
      'start-consultation',
      'no-response',
      'complete-consultation',
      'recall',
    ])
      await expectEntryConflict(entry, operation);
    await expectConflict(
      fixture.session.id,
      'close',
      { version: fixture.session.version },
      'unresolved-close',
    );
  });

  it('rejects repeated pause and resume while open', async () => {
    let current = await session();
    let response = await sessionCommand('pause', current.version);
    expect(response.status).toBe(200);
    current = await session();
    await expectConflict(
      current.id,
      'pause',
      { version: current.version },
      'already-paused',
    );
    response = await sessionCommand('resume', current.version);
    expect(response.status).toBe(200);
    current = await session();
    await expectConflict(
      current.id,
      'resume',
      { version: current.version },
      'already-open',
    );
  });

  it('rejects called, current-patient, consultation, and completed invalid transitions', async () => {
    let current = await session();
    let response = await sessionCommand('call-next', current.version);
    expect(response.status).toBe(200);
    let entry = await firstEntry('called');
    await expectEntryConflict(entry, 'complete-consultation');
    await expectEntryConflict(entry, 'recall');

    response = await entryCommand(entry, 'no-response');
    expect(response.status).toBe(200);
    const noResponse = await firstEntry('noResponse');
    current = await session();
    response = await sessionCommand('call-next', current.version);
    expect(response.status).toBe(200);
    await expectEntryConflict(noResponse, 'recall');

    entry = await firstEntry('called');
    response = await entryCommand(entry, 'start-consultation');
    expect(response.status).toBe(200);
    entry = await firstEntry('inConsultation');
    for (const operation of ['no-response', 'recall'])
      await expectEntryConflict(entry, operation);
    response = await entryCommand(entry, 'complete-consultation');
    expect(response.status).toBe(200);
    const completed = await firstEntry('completed');
    for (const operation of [
      'recall',
      'no-response',
      'start-consultation',
      'complete-consultation',
    ])
      await expectEntryConflict(completed, operation);
  });

  it('rejects every session mutation after close', async () => {
    let current = await session();
    let response = await sessionCommand('call-next', current.version);
    expect(response.status).toBe(200);
    let entry = await firstEntry('called');
    response = await entryCommand(entry, 'start-consultation');
    expect(response.status).toBe(200);
    entry = await firstEntry('inConsultation');
    response = await entryCommand(entry, 'complete-consultation');
    expect(response.status).toBe(200);
    current = await session();
    response = await sessionCommand('close', current.version);
    expect(response.status).toBe(200);
    for (const operation of ['pause', 'resume', 'close', 'call-next']) {
      current = await session();
      await expectConflict(
        current.id,
        operation,
        { version: current.version },
        `after-close-${operation}`,
      );
    }
  });

  it('replays duplicate open with the same key and rejects a stale new key', async () => {
    const tenant = await createApiTenant('duplicate-open');
    const doctor = await createRolePrincipal('doctor', tenant);
    const manager = await createRolePrincipal('clinicManager', tenant);
    const path = `/api/v1/clinics/${tenant.clinicId}/doctors/${doctor.doctorId}/queue-sessions/open`;
    const first = await request(app.getHttpServer())
      .post(path)
      .set('Authorization', `Bearer ${manager.token}`)
      .set('Idempotency-Key', 'duplicate-open-key')
      .send({ version: 1 });
    expect(first.status).toBe(200);
    const replay = await request(app.getHttpServer())
      .post(path)
      .set('Authorization', `Bearer ${manager.token}`)
      .set('Idempotency-Key', 'duplicate-open-key')
      .send({ version: 1 });
    expect(replay.status).toBe(200);
    expect(replay.body).toEqual(first.body);
    const stale = await request(app.getHttpServer())
      .post(path)
      .set('Authorization', `Bearer ${manager.token}`)
      .set('Idempotency-Key', 'duplicate-open-new-key')
      .send({ version: 1 });
    expect(stale.status).toBe(409);
    expectErrorEnvelope(stale.body, 409);
  });

  async function expectConflict(
    sessionId: string,
    operation: string,
    body: object,
    key: string,
  ) {
    const before = await state(sessionId);
    const response = await request(app.getHttpServer())
      .post(`/api/v1/queue-sessions/${sessionId}/${operation}`)
      .set('Authorization', `Bearer ${fixture.manager.token}`)
      .set('Idempotency-Key', key)
      .send(body);
    expect(response.status).toBe(409);
    expectErrorEnvelope(response.body, 409);
    expect(await state(sessionId)).toEqual(before);
  }

  async function expectEntryConflict(
    entry: { id: string; version: number },
    operation: string,
  ) {
    const current = await session();
    const before = await state(current.id);
    const response = await entryCommand(entry, operation);
    expect(response.status).toBe(409);
    expectErrorEnvelope(response.body, 409);
    expect(await state(current.id)).toEqual(before);
  }

  async function sessionCommand(operation: string, version: number) {
    return request(app.getHttpServer())
      .post(`/api/v1/queue-sessions/${fixture.session.id}/${operation}`)
      .set('Authorization', `Bearer ${fixture.manager.token}`)
      .set('Idempotency-Key', `${operation}-${randomUUID()}`)
      .send({ version });
  }

  async function entryCommand(
    entry: { id: string; version: number },
    operation: string,
  ) {
    const current = await session();
    return request(app.getHttpServer())
      .post(
        `/api/v1/queue-sessions/${current.id}/entries/${entry.id}/${operation}`,
      )
      .set('Authorization', `Bearer ${fixture.manager.token}`)
      .set('Idempotency-Key', `${operation}-${randomUUID()}`)
      .send({ sessionVersion: current.version, entryVersion: entry.version });
  }

  function session() {
    return apiPrisma.queueSession.findUniqueOrThrow({
      where: { id: fixture.session.id },
    });
  }

  function firstEntry(status: string) {
    return apiPrisma.queueEntry.findFirstOrThrow({
      where: { queueSessionId: fixture.session.id, status: status as never },
      orderBy: { ticketNumber: 'asc' },
    });
  }

  async function state(sessionId: string) {
    const [queue, activities, queueAudits, audits, outbox, successfulCommands] =
      await Promise.all([
        apiPrisma.queueSession.findUniqueOrThrow({
          where: { id: sessionId },
          include: { entries: { orderBy: { ticketNumber: 'asc' } } },
        }),
        apiPrisma.queueActivity.count({ where: { queueSessionId: sessionId } }),
        apiPrisma.queueAudit.count({ where: { queueSessionId: sessionId } }),
        apiPrisma.auditEvent.count({ where: { targetId: sessionId } }),
        apiPrisma.outboxEvent.count({ where: { aggregateId: sessionId } }),
        apiPrisma.idempotencyRecord.count({
          where: { scope: { contains: sessionId }, responseCode: 200 },
        }),
      ]);
    return {
      status: queue.status,
      version: queue.version,
      entries: queue.entries.map(({ status, version }) => ({
        status,
        version,
      })),
      activities,
      queueAudits,
      audits,
      outbox,
      successfulCommands,
    };
  }
});
