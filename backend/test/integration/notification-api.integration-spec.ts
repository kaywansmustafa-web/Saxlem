/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import type { PrismaService } from '../../src/infrastructure/database/prisma.service';
import { createApplication } from '../../src/main';
import { NotificationOutboxWorker } from '../../src/modules/notifications/infrastructure/notification-outbox.worker';
import {
  apiConfiguration,
  apiPrisma,
  createRolePrincipal,
  createSeededQueue,
} from './live-queue-api-fixture';

describe('notification inbox API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApplication({
      ...apiConfiguration,
      notificationSsePollIntervalMs: 10,
      notificationSseHeartbeatIntervalMs: 50,
      notificationSseMaxConnectionMs: 150,
    });
    await app.init();
  });
  afterAll(async () => {
    await app.close();
    await apiPrisma.$disconnect();
  });

  it('lists only the recipient and marks read idempotently', async () => {
    const seeded = await createSeededQueue(1);
    const platform = await createRolePrincipal(
      'platformAdministrator',
      seeded.tenant,
    );
    const worker = new NotificationOutboxWorker(
      { db: apiPrisma } as unknown as PrismaService,
      { ...apiConfiguration, notificationWorkerTickLimit: 100 },
    );
    await worker.processTick();

    const patientList = await request(app.getHttpServer())
      .get('/api/v1/notifications?pageSize=1')
      .set('Authorization', `Bearer ${seeded.patient.token}`)
      .expect(200);
    expect(patientList.body.items).toHaveLength(1);
    expect(Object.keys(patientList.body.items[0]).sort()).toEqual(
      [
        'id',
        'deliverySequence',
        'type',
        'priority',
        'actionCode',
        'occurredAt',
        'createdAt',
        'readAt',
      ].sort(),
    );
    expect(patientList.body.items[0].readAt).toBeNull();
    expect(patientList.body.nextCursor).toEqual(expect.any(String));

    const managerList = await request(app.getHttpServer())
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${seeded.manager.token}`)
      .expect(200);
    expect(managerList.body.items.length).toBeGreaterThan(0);
    expect(
      managerList.body.items.some(
        ({ id }: { id: string }) => id === patientList.body.items[0].id,
      ),
    ).toBe(false);
    const patientStream = await request(app.getHttpServer())
      .get('/api/v1/notifications/stream')
      .set('Authorization', `Bearer ${seeded.patient.token}`)
      .expect(200)
      .expect('Content-Type', /text\/event-stream/);
    expect(patientStream.text).toContain('event: notification');
    expect(patientStream.text).toContain(
      `id: ${patientList.body.items[0].deliverySequence}`,
    );
    expect(patientStream.text).not.toContain(managerList.body.items[0].id);
    const patientPage = await request(app.getHttpServer())
      .get('/api/v1/notifications?pageSize=25')
      .set('Authorization', `Bearer ${seeded.patient.token}`)
      .expect(200);
    expect(patientPage.body.items.length).toBeGreaterThanOrEqual(2);
    const streamReplay = await request(app.getHttpServer())
      .get('/api/v1/notifications/stream')
      .set('Authorization', `Bearer ${seeded.patient.token}`)
      .set(
        'Last-Event-ID',
        patientPage.body.items[0].deliverySequence as string,
      )
      .expect(200);
    expect(streamReplay.text).not.toContain(
      `"deliverySequence":"${patientPage.body.items[0].deliverySequence}"`,
    );
    expect(streamReplay.text).toContain(
      `"deliverySequence":"${patientPage.body.items[1].deliverySequence}"`,
    );
    await request(app.getHttpServer())
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${seeded.doctor.token}`)
      .set('x-organization-id', seeded.tenant.organizationId)
      .set('x-clinic-id', seeded.tenant.clinicId)
      .expect(200);
    await request(app.getHttpServer())
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${platform.token}`)
      .expect(403);
    await request(app.getHttpServer())
      .get('/api/v1/notifications/stream')
      .set('Authorization', `Bearer ${seeded.patient.token}`)
      .set('Last-Event-ID', 'malformed')
      .expect(400);
    await request(app.getHttpServer())
      .get('/api/v1/notifications/stream')
      .set('Authorization', `Bearer ${seeded.doctor.token}`)
      .set('Last-Event-ID', 'malformed')
      .expect(400);
    await request(app.getHttpServer())
      .get('/api/v1/notifications/stream')
      .set('Authorization', `Bearer ${platform.token}`)
      .set('Last-Event-ID', 'malformed')
      .expect(403);

    await apiPrisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION notification_test_audit_failure()
      RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        IF NEW.action = 'notification.marked-read' THEN
          RAISE EXCEPTION 'audit unavailable';
        END IF;
        RETURN NEW;
      END
      $$;
      CREATE TRIGGER notification_test_audit_failure_trigger
      BEFORE INSERT ON audit_events
      FOR EACH ROW EXECUTE FUNCTION notification_test_audit_failure();
    `);
    await request(app.getHttpServer())
      .post(`/api/v1/notifications/${patientList.body.items[0].id}/read`)
      .set('Authorization', `Bearer ${seeded.patient.token}`)
      .set('Idempotency-Key', 'audit-rollback-test')
      .expect(503);
    expect(
      (
        await apiPrisma.notificationRecord.findUniqueOrThrow({
          where: { id: patientList.body.items[0].id },
        })
      ).readAt,
    ).toBeNull();
    expect(
      await apiPrisma.idempotencyRecord.count({
        where: {
          actorId: seeded.patient.userId,
          scope: 'notification.mark-read',
          key: 'audit-rollback-test',
        },
      }),
    ).toBe(0);
    await apiPrisma.$executeRawUnsafe(`
      DROP TRIGGER notification_test_audit_failure_trigger ON audit_events;
      DROP FUNCTION notification_test_audit_failure();
    `);

    const key = 'notification-read-test';
    const first = await request(app.getHttpServer())
      .post(`/api/v1/notifications/${patientList.body.items[0].id}/read`)
      .set('Authorization', `Bearer ${seeded.patient.token}`)
      .set('Idempotency-Key', key)
      .expect(200);
    const replay = await request(app.getHttpServer())
      .post(`/api/v1/notifications/${patientList.body.items[0].id}/read`)
      .set('Authorization', `Bearer ${seeded.patient.token}`)
      .set('Idempotency-Key', key)
      .expect(200);
    expect(first.body).toEqual(replay.body);
    expect(first.body.notification.readAt).toEqual(expect.any(String));

    await request(app.getHttpServer())
      .post(`/api/v1/notifications/${patientList.body.items[0].id}/read`)
      .set('Authorization', `Bearer ${seeded.manager.token}`)
      .set('Idempotency-Key', 'foreign-notification-read')
      .expect(404);
    expect(
      await apiPrisma.auditEvent.count({
        where: {
          targetId: patientList.body.items[0].id,
          action: 'notification.marked-read',
        },
      }),
    ).toBe(1);
  }, 15_000);

  it.each(['1', '0', 'yes', '', 'TRUE', 'arbitrary'])(
    'rejects invalid unreadOnly value %j',
    async (value) => {
      const seeded = await createSeededQueue(0);
      await request(app.getHttpServer())
        .get('/api/v1/notifications')
        .query({ unreadOnly: value })
        .set('Authorization', `Bearer ${seeded.patient.token}`)
        .expect(400);
    },
  );

  it('accepts only canonical unreadOnly booleans and rejects repetition', async () => {
    const seeded = await createSeededQueue(0);
    for (const value of ['true', 'false'])
      await request(app.getHttpServer())
        .get('/api/v1/notifications')
        .query({ unreadOnly: value })
        .set('Authorization', `Bearer ${seeded.patient.token}`)
        .expect(200);
    await request(app.getHttpServer())
      .get('/api/v1/notifications?unreadOnly=true&unreadOnly=false')
      .set('Authorization', `Bearer ${seeded.patient.token}`)
      .expect(400);
  });
});
