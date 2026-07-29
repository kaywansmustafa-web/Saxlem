/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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

describe('live queue HTTP failure-envelope certification', () => {
  let app: INestApplication<App>;
  let fixture: Awaited<ReturnType<typeof createSeededQueue>>;

  beforeAll(async () => {
    app = await createQueueApiApplication();
    fixture = await createSeededQueue(1);
  });

  afterEach(async () => {
    for (const [table, name] of [
      ['queue_audits', 'api_queue_audit_failure'],
      ['idempotency_records', 'api_queue_unknown_failure'],
      ['idempotency_records', 'api_queue_retry_failure'],
    ] as const)
      await removeFailureTrigger(table, name);
  });

  afterAll(async () => {
    await app.close();
    await apiPrisma.$disconnect();
  });

  it('sanitizes audit persistence failure as retryable 503', async () => {
    await installFailureTrigger(
      'queue_audits',
      'api_queue_audit_failure',
      'TRUE',
      '23514',
    );
    await expectSanitizedFailure('pause', 503);
  });

  it('sanitizes retry exhaustion as retryable 503', async () => {
    await installFailureTrigger(
      'idempotency_records',
      'api_queue_retry_failure',
      "NEW.scope LIKE 'queue.call-next:%'",
      '40001',
    );
    await expectSanitizedFailure('call-next', 503);
  });

  it('sanitizes an unknown database failure as 500', async () => {
    await installFailureTrigger(
      'idempotency_records',
      'api_queue_unknown_failure',
      "NEW.scope LIKE 'queue.pause:%'",
      'XX000',
    );
    await expectSanitizedFailure('pause', 500);
  });

  async function expectSanitizedFailure(operation: string, status: number) {
    const before = await snapshot();
    const response = await request(app.getHttpServer())
      .post(`/api/v1/queue-sessions/${fixture.session.id}/${operation}`)
      .set('Authorization', `Bearer ${fixture.manager.token}`)
      .set('Idempotency-Key', `${operation}-${randomUUID()}`)
      .send({ version: before.version });
    expect(response.status).toBe(status);
    expectErrorEnvelope(response.body, status);
    expect(await snapshot()).toEqual(before);
    const serialized = JSON.stringify(response.body);
    expect(serialized).not.toMatch(
      /P20\d\d|23\d\d\d|40P01|40001|SELECT|INSERT|UPDATE|queue_audits|queue_activities|\.ts:\d|\\src\\/i,
    );
  }

  async function snapshot() {
    const [session, activities, audits, outbox, successfulCommands] =
      await Promise.all([
        apiPrisma.queueSession.findUniqueOrThrow({
          where: { id: fixture.session.id },
        }),
        apiPrisma.queueActivity.count({
          where: { queueSessionId: fixture.session.id },
        }),
        apiPrisma.queueAudit.count({
          where: { queueSessionId: fixture.session.id },
        }),
        apiPrisma.outboxEvent.count({
          where: { aggregateId: fixture.session.id },
        }),
        apiPrisma.idempotencyRecord.count({
          where: {
            scope: { contains: fixture.session.id },
            responseCode: 200,
          },
        }),
      ]);
    return {
      status: session.status,
      version: session.version,
      activities,
      audits,
      outbox,
      successfulCommands,
    };
  }
});

async function installFailureTrigger(
  table: string,
  name: string,
  condition: string,
  code: string,
) {
  await removeFailureTrigger(table, name);
  await apiPrisma.$executeRawUnsafe(`
    CREATE FUNCTION ${name}() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF ${condition} THEN
        RAISE EXCEPTION USING ERRCODE = '${code}', MESSAGE = '${name}';
      END IF;
      RETURN NEW;
    END $$`);
  await apiPrisma.$executeRawUnsafe(`
    CREATE TRIGGER ${name} BEFORE INSERT ON ${table}
    FOR EACH ROW EXECUTE FUNCTION ${name}()`);
}

async function removeFailureTrigger(table: string, name: string) {
  await apiPrisma.$executeRawUnsafe(
    `DROP TRIGGER IF EXISTS ${name} ON ${table}`,
  );
  await apiPrisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS ${name}()`);
}
