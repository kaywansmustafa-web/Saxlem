import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Client } from 'pg';
import request from 'supertest';
import type { PrismaService } from '../../src/infrastructure/database/prisma.service';
import { createApplication } from '../../src/main';
import { NotificationOutboxWorker } from '../../src/modules/notifications/infrastructure/notification-outbox.worker';
import {
  apiConfiguration,
  apiDatabaseUrl,
  apiPrisma,
  createRolePrincipal,
  createSeededQueue,
} from './live-queue-api-fixture';

jest.setTimeout(15_000);

describe('notification outbox worker', () => {
  beforeEach(async () => {
    await apiPrisma.outboxEvent.updateMany({
      where: { publishedAt: null },
      data: { publishedAt: new Date(), attempts: 1 },
    });
  });

  afterAll(() => apiPrisma.$disconnect());

  it('projects supported events once across two workers and leaves unsupported events untouched', async () => {
    const seeded = await createSeededQueue(1);
    const receptionist = await createRolePrincipal(
      'receptionist',
      seeded.tenant,
    );
    const platform = await createRolePrincipal(
      'platformAdministrator',
      seeded.tenant,
    );
    await apiPrisma.clinicMembership.create({
      data: {
        organizationId: seeded.tenant.organizationId,
        clinicId: seeded.tenant.clinicId,
        userId: platform.userId,
        role: 'receptionist',
      },
    });
    const unsupported = await apiPrisma.outboxEvent.create({
      data: {
        aggregateType: 'Appointment',
        aggregateId: randomUUID(),
        eventType: 'appointment.completedFromQueue',
        payload: {},
        occurredAt: new Date(),
      },
    });
    const config = {
      ...apiConfiguration,
      notificationWorkerTickLimit: 100,
      notificationWorkerMaxAttempts: 3,
    };
    const firstClient = independentClient();
    const secondClient = independentClient();
    const first = new NotificationOutboxWorker(
      { db: firstClient } as unknown as PrismaService,
      config,
    );
    const second = new NotificationOutboxWorker(
      { db: secondClient } as unknown as PrismaService,
      config,
    );

    try {
      await Promise.all([first.processTick(), second.processTick()]);
    } finally {
      await Promise.all([
        firstClient.$disconnect(),
        secondClient.$disconnect(),
      ]);
    }

    const supported = await apiPrisma.outboxEvent.findMany({
      where: {
        eventType: { startsWith: 'queue.' },
        aggregateId: seeded.session.id,
      },
      select: { id: true, publishedAt: true },
    });
    expect(supported.length).toBeGreaterThan(0);
    expect(supported.every(({ publishedAt }) => publishedAt !== null)).toBe(
      true,
    );
    const notifications = await apiPrisma.notificationRecord.findMany({
      where: { sourceOutboxEventId: { in: supported.map(({ id }) => id) } },
      select: {
        sourceOutboxEventId: true,
        recipientUserId: true,
        type: true,
        patientProfileId: true,
        payload: true,
      },
    });
    expect(
      new Set(
        notifications.map(
          (item) =>
            `${item.sourceOutboxEventId}:${item.recipientUserId}:${item.type}`,
        ),
      ).size,
    ).toBe(notifications.length);
    expect(
      notifications.some(
        ({ recipientUserId }) => recipientUserId === seeded.patient.userId,
      ),
    ).toBe(true);
    expect(
      notifications.some(
        ({ recipientUserId }) => recipientUserId === seeded.doctor.userId,
      ),
    ).toBe(true);
    expect(
      notifications.some(
        ({ recipientUserId }) => recipientUserId === seeded.manager.userId,
      ),
    ).toBe(true);
    expect(
      notifications.some(
        ({ recipientUserId }) => recipientUserId === receptionist.userId,
      ),
    ).toBe(true);
    expect(
      notifications.some(
        ({ recipientUserId }) => recipientUserId === platform.userId,
      ),
    ).toBe(false);
    const patientRows = notifications.filter(
      ({ recipientUserId }) => recipientUserId === seeded.patient.userId,
    );
    expect(
      patientRows.every(
        ({ patientProfileId }) => patientProfileId === seeded.profile.id,
      ),
    ).toBe(true);
    expect(
      notifications.every(({ payload }) =>
        Object.keys(payload as Record<string, unknown>).every(
          (key) => key === 'actionCode',
        ),
      ),
    ).toBe(true);
    await expect(
      apiPrisma.notificationRecord.create({
        data: {
          sourceOutboxEventId: notifications[0]!.sourceOutboxEventId,
          organizationId: seeded.tenant.organizationId,
          clinicId: seeded.tenant.clinicId,
          recipientUserId: notifications[0]!.recipientUserId,
          patientProfileId: notifications[0]!.patientProfileId,
          type: notifications[0]!.type,
          payload: { actionCode: notifications[0]!.type },
          occurredAt: new Date(),
        },
      }),
    ).rejects.toBeDefined();
    expect(
      (
        await apiPrisma.outboxEvent.findUniqueOrThrow({
          where: { id: unsupported.id },
        })
      ).publishedAt,
    ).toBeNull();
  });

  it('retries a poison event, terminates it, and continues with later work', async () => {
    const seeded = await createSeededQueue(0);
    await apiPrisma.outboxEvent.updateMany({
      where: { aggregateId: seeded.session.id },
      data: { publishedAt: new Date(), attempts: 1 },
    });
    const poison = await apiPrisma.outboxEvent.create({
      data: {
        aggregateType: 'QueueSession',
        aggregateId: randomUUID(),
        eventType: 'queue.session.paused',
        payload: {
          organizationId: seeded.tenant.organizationId,
          clinicId: seeded.tenant.clinicId,
          queueSessionId: randomUUID(),
          queueEntryId: null,
        },
        occurredAt: new Date(),
      },
    });
    const worker = new NotificationOutboxWorker(
      { db: apiPrisma } as unknown as PrismaService,
      {
        ...apiConfiguration,
        notificationWorkerTickLimit: 10,
        notificationWorkerMaxAttempts: 2,
        notificationWorkerRetryBaseMs: 100,
        notificationWorkerRetryMaxMs: 1000,
      },
    );
    await worker.processTick();
    const retried = await apiPrisma.outboxEvent.findUniqueOrThrow({
      where: { id: poison.id },
    });
    expect(retried).toMatchObject({
      attempts: 1,
      publishedAt: null,
      failedAt: null,
      lastErrorCode: 'PROJECTION_RETRY',
    });
    expect(retried.nextAttemptAt).not.toBeNull();
    await apiPrisma.outboxEvent.update({
      where: { id: poison.id },
      data: { nextAttemptAt: new Date(0) },
    });
    await worker.processTick();
    expect(
      await apiPrisma.outboxEvent.findUniqueOrThrow({
        where: { id: poison.id },
      }),
    ).toMatchObject({
      attempts: 2,
      publishedAt: null,
      lastErrorCode: 'PROJECTION_TERMINAL',
    });
    const later = await apiPrisma.outboxEvent.create({
      data: {
        aggregateType: 'QueueSession',
        aggregateId: seeded.session.id,
        eventType: 'queue.session.resumed',
        payload: {
          organizationId: seeded.tenant.organizationId,
          clinicId: seeded.tenant.clinicId,
          queueSessionId: seeded.session.id,
          queueEntryId: null,
        },
        occurredAt: new Date(),
      },
    });
    await worker.processTick();
    expect(
      (
        await apiPrisma.outboxEvent.findUniqueOrThrow({
          where: { id: later.id },
        })
      ).publishedAt,
    ).not.toBeNull();
  });

  it('serializes commit-safe delivery order for the same recipients across independent connections', async () => {
    const seeded = await createSeededQueue(0);
    await apiPrisma.outboxEvent.updateMany({
      where: { aggregateId: seeded.session.id },
      data: { publishedAt: new Date(), attempts: 1 },
    });
    const firstEvent = await apiPrisma.outboxEvent.create({
      data: {
        aggregateType: 'QueueSession',
        aggregateId: seeded.session.id,
        eventType: 'queue.session.paused',
        payload: queuePayload(seeded),
        occurredAt: new Date(Date.now() - 1000),
      },
    });
    const secondEvent = await apiPrisma.outboxEvent.create({
      data: {
        aggregateType: 'QueueSession',
        aggregateId: seeded.session.id,
        eventType: 'queue.session.resumed',
        payload: queuePayload(seeded),
        occurredAt: new Date(),
      },
    });
    await apiPrisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION notification_test_delay()
      RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        IF NEW.source_outbox_event_id = '${firstEvent.id}'::uuid THEN
          PERFORM pg_sleep(0.15);
        END IF;
        RETURN NEW;
      END
      $$;
      CREATE TRIGGER notification_test_delay_trigger
      BEFORE INSERT ON notification_records
      FOR EACH ROW EXECUTE FUNCTION notification_test_delay();
    `);
    const firstClient = independentClient();
    const secondClient = independentClient();
    const config = { ...apiConfiguration, notificationWorkerTickLimit: 1 };
    const firstWorker = new NotificationOutboxWorker(
      { db: firstClient } as unknown as PrismaService,
      config,
    );
    const secondWorker = new NotificationOutboxWorker(
      { db: secondClient } as unknown as PrismaService,
      config,
    );
    const completion: string[] = [];
    try {
      const first = firstWorker
        .processTick()
        .then(() => completion.push('first'));
      await new Promise((resolve) => setTimeout(resolve, 30));
      const second = secondWorker
        .processTick()
        .then(() => completion.push('second'));
      await Promise.all([first, second]);
      expect(completion).toEqual(['first', 'second']);
      const delivered = await apiPrisma.notificationRecord.findMany({
        where: {
          recipientUserId: seeded.manager.userId,
          sourceOutboxEventId: { in: [firstEvent.id, secondEvent.id] },
        },
        orderBy: { deliverySequence: 'asc' },
        select: { sourceOutboxEventId: true, deliverySequence: true },
      });
      expect(
        delivered.map(({ sourceOutboxEventId }) => sourceOutboxEventId),
      ).toEqual([firstEvent.id, secondEvent.id]);
      expect(
        delivered[0]!.deliverySequence < delivered[1]!.deliverySequence,
      ).toBe(true);
    } finally {
      await Promise.all([
        firstClient.$disconnect(),
        secondClient.$disconnect(),
      ]);
      await apiPrisma.$executeRawUnsafe(`
        DROP TRIGGER IF EXISTS notification_test_delay_trigger
          ON notification_records;
        DROP FUNCTION IF EXISTS notification_test_delay();
      `);
    }
  });

  it('excludes every inactive recipient path and publishes a valid zero-recipient event', async () => {
    const seeded = await createSeededQueue(0);
    const receptionist = await createRolePrincipal(
      'receptionist',
      seeded.tenant,
    );
    await apiPrisma.outboxEvent.updateMany({
      where: { aggregateId: seeded.session.id },
      data: { publishedAt: new Date(), attempts: 1 },
    });
    await apiPrisma.clinicMembership.updateMany({
      where: {
        userId: { in: [seeded.manager.userId, receptionist.userId] },
        organizationId: seeded.tenant.organizationId,
        clinicId: seeded.tenant.clinicId,
      },
      data: { status: 'inactive' },
    });
    await apiPrisma.user.update({
      where: { id: seeded.doctor.userId },
      data: { status: 'inactive' },
    });
    const event = await apiPrisma.outboxEvent.create({
      data: {
        aggregateType: 'QueueSession',
        aggregateId: seeded.session.id,
        eventType: 'queue.session.paused',
        payload: queuePayload(seeded),
        occurredAt: new Date(),
      },
    });
    const client = independentClient();
    try {
      const worker = new NotificationOutboxWorker(
        { db: client } as unknown as PrismaService,
        { ...apiConfiguration, notificationWorkerTickLimit: 1 },
      );
      await worker.processTick();
    } finally {
      await client.$disconnect();
    }
    expect(
      (
        await apiPrisma.outboxEvent.findUniqueOrThrow({
          where: { id: event.id },
        })
      ).publishedAt,
    ).not.toBeNull();
    expect(
      await apiPrisma.notificationRecord.count({
        where: { sourceOutboxEventId: event.id },
      }),
    ).toBe(0);
  });

  it('excludes an operational member after staff-account invalidation', async () => {
    const seeded = await createSeededQueue(0);
    const receptionist = await createRolePrincipal(
      'receptionist',
      seeded.tenant,
    );
    await apiPrisma.outboxEvent.updateMany({
      where: { aggregateId: seeded.session.id },
      data: { publishedAt: new Date(), attempts: 1 },
    });
    await apiPrisma.staffAccount.delete({
      where: { userId: receptionist.userId },
    });
    const event = await apiPrisma.outboxEvent.create({
      data: {
        aggregateType: 'QueueSession',
        aggregateId: seeded.session.id,
        eventType: 'queue.session.paused',
        payload: queuePayload(seeded),
        occurredAt: new Date(),
      },
    });
    const worker = new NotificationOutboxWorker(
      { db: apiPrisma } as unknown as PrismaService,
      { ...apiConfiguration, notificationWorkerTickLimit: 1 },
    );
    await worker.processTick();
    expect(
      await apiPrisma.notificationRecord.count({
        where: {
          sourceOutboxEventId: event.id,
          recipientUserId: receptionist.userId,
        },
      }),
    ).toBe(0);
  });

  it('holds recipient eligibility through commit while membership deactivation waits', async () => {
    const seeded = await createSeededQueue(0);
    const receptionist = await createRolePrincipal(
      'receptionist',
      seeded.tenant,
    );
    await apiPrisma.outboxEvent.updateMany({
      where: { aggregateId: seeded.session.id },
      data: { publishedAt: new Date(), attempts: 1 },
    });
    const event = await apiPrisma.outboxEvent.create({
      data: {
        aggregateType: 'QueueSession',
        aggregateId: seeded.session.id,
        eventType: 'queue.session.paused',
        payload: queuePayload(seeded),
        occurredAt: new Date(),
      },
    });
    const barrier = independentClient();
    const workerClient = independentClient();
    const deactivationClient = independentClient();
    try {
      await barrier.$executeRaw`SELECT pg_advisory_lock(734921)`;
      await apiPrisma.$executeRawUnsafe(`
        CREATE OR REPLACE FUNCTION notification_eligibility_barrier()
        RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          IF NEW.source_outbox_event_id = '${event.id}'::uuid THEN
            PERFORM pg_advisory_xact_lock(734921);
          END IF;
          RETURN NEW;
        END
        $$;
        CREATE TRIGGER notification_eligibility_barrier_trigger
        BEFORE INSERT ON notification_records
        FOR EACH ROW EXECUTE FUNCTION notification_eligibility_barrier();
      `);
      const worker = new NotificationOutboxWorker(
        { db: workerClient } as unknown as PrismaService,
        { ...apiConfiguration, notificationWorkerTickLimit: 1 },
      );
      const projection = worker.processTick();
      await waitUntilBlocked('notification_records');
      let deactivationCommitted = false;
      const deactivation = deactivationClient.clinicMembership
        .updateMany({
          where: {
            organizationId: seeded.tenant.organizationId,
            clinicId: seeded.tenant.clinicId,
            userId: receptionist.userId,
            role: 'receptionist',
          },
          data: { status: 'inactive' },
        })
        .then(() => {
          deactivationCommitted = true;
        });
      await waitUntilBlocked('clinic_memberships');
      expect(deactivationCommitted).toBe(false);
      await barrier.$executeRaw`SELECT pg_advisory_unlock(734921)`;
      await projection;
      await deactivation;
      expect(
        await apiPrisma.notificationRecord.count({
          where: {
            sourceOutboxEventId: event.id,
            recipientUserId: receptionist.userId,
          },
        }),
      ).toBe(1);
    } finally {
      await barrier.$executeRaw`SELECT pg_advisory_unlock_all()`;
      await Promise.all([
        barrier.$disconnect(),
        workerClient.$disconnect(),
        deactivationClient.$disconnect(),
      ]);
      await apiPrisma.$executeRawUnsafe(`
        DROP TRIGGER IF EXISTS notification_eligibility_barrier_trigger
          ON notification_records;
        DROP FUNCTION IF EXISTS notification_eligibility_barrier();
      `);
    }
  });

  it.each([
    'clinic-manager-membership',
    'doctor-assignment',
    'patient-registration',
    'patient-ownership',
    'user',
    'staff-account',
  ] as const)(
    'certifies %s revocation when deactivation commits before projection',
    async (relationship) => {
      await certifyRevocationRace(relationship, 'deactivation-first');
    },
  );

  it.each([
    'clinic-manager-membership',
    'doctor-assignment',
    'patient-registration',
    'patient-ownership',
    'user',
    'staff-account',
  ] as const)(
    'certifies %s revocation when projection reaches serialization first',
    async (relationship) => {
      await certifyRevocationRace(relationship, 'projection-first');
    },
  );

  it('certifies overlapping recipient locks and delayed-commit HTTP SSE replay', async () => {
    const seeded = await createSeededQueue(0);
    await apiPrisma.outboxEvent.updateMany({
      where: { publishedAt: null },
      data: { publishedAt: new Date(), attempts: 1 },
    });
    const [firstEvent, secondEvent] = await Promise.all([
      apiPrisma.outboxEvent.create({
        data: {
          aggregateType: 'QueueSession',
          aggregateId: seeded.session.id,
          eventType: 'queue.session.paused',
          payload: queuePayload(seeded),
          occurredAt: new Date(Date.now() - 1),
        },
      }),
      apiPrisma.outboxEvent.create({
        data: {
          aggregateType: 'QueueSession',
          aggregateId: seeded.session.id,
          eventType: 'queue.session.resumed',
          payload: queuePayload(seeded),
          occurredAt: new Date(),
        },
      }),
    ]);
    const barrier = new Client({ connectionString: apiDatabaseUrl });
    const firstClient = independentClient();
    const secondClient = independentClient();
    await barrier.connect();
    try {
      await barrier.query('SELECT pg_advisory_lock(910001)');
      await installEventBarrier(firstEvent.id, 910001, 'overlap');
      const config = { ...apiConfiguration, notificationWorkerTickLimit: 1 };
      const first = new NotificationOutboxWorker(
        { db: firstClient } as unknown as PrismaService,
        config,
      ).processTick();
      await waitUntilBlocked('notification_records');
      const second = new NotificationOutboxWorker(
        { db: secondClient } as unknown as PrismaService,
        config,
      ).processTick();
      await waitForLockWaitCount(2);
      await barrier.query('SELECT pg_advisory_unlock(910001)');
      await Promise.all([first, second]);
      const projected = await apiPrisma.notificationRecord.groupBy({
        by: ['sourceOutboxEventId', 'recipientUserId'],
        where: {
          sourceOutboxEventId: { in: [firstEvent.id, secondEvent.id] },
        },
        _count: true,
      });
      expect(projected.length).toBeGreaterThan(0);
      expect(projected.every(({ _count }) => _count === 1)).toBe(true);
      for (const id of [firstEvent.id, secondEvent.id]) {
        const outbox = await apiPrisma.outboxEvent.findUniqueOrThrow({
          where: { id },
        });
        expect(outbox.publishedAt).not.toBeNull();
        expect(outbox.attempts).toBe(1);
      }
      const delivered = await apiPrisma.notificationRecord.findMany({
        where: {
          recipientUserId: seeded.manager.userId,
          sourceOutboxEventId: { in: [firstEvent.id, secondEvent.id] },
        },
        orderBy: { deliverySequence: 'asc' },
      });
      expect(
        delivered.map(({ sourceOutboxEventId }) => sourceOutboxEventId),
      ).toEqual([firstEvent.id, secondEvent.id]);
      const app = await createApplication({
        ...apiConfiguration,
        notificationSsePollIntervalMs: 10,
        notificationSseHeartbeatIntervalMs: 50,
        notificationSseMaxConnectionMs: 150,
      });
      await app.init();
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const replay = await request(app.getHttpServer())
          .get('/api/v1/notifications/stream')
          .set('Authorization', `Bearer ${seeded.manager.token}`)
          .set('x-organization-id', seeded.tenant.organizationId)
          .set('x-clinic-id', seeded.tenant.clinicId)
          .set('Last-Event-ID', delivered[0]!.deliverySequence.toString())
          .expect(200);
        const secondSequence = `"deliverySequence":"${delivered[1]!.deliverySequence.toString()}"`;
        expect(replay.text).not.toContain(
          `"deliverySequence":"${delivered[0]!.deliverySequence.toString()}"`,
        );
        expect(replay.text.match(new RegExp(secondSequence, 'g'))).toHaveLength(
          1,
        );
      } finally {
        await app.close();
      }
    } finally {
      await barrier.query('SELECT pg_advisory_unlock_all()');
      await barrier.end();
      await Promise.all([
        firstClient.$disconnect(),
        secondClient.$disconnect(),
      ]);
      await removeEventBarrier('overlap');
    }
  });

  it('certifies non-overlapping recipient sets process concurrently', async () => {
    const firstSeed = await createSeededQueue(0);
    const secondSeed = await createSeededQueue(0);
    await apiPrisma.outboxEvent.updateMany({
      where: { publishedAt: null },
      data: { publishedAt: new Date(), attempts: 1 },
    });
    const firstEvent = await createQueueEvent(
      firstSeed,
      'queue.session.paused',
    );
    const secondEvent = await createQueueEvent(
      secondSeed,
      'queue.session.paused',
    );
    const firstBarrier = new Client({ connectionString: apiDatabaseUrl });
    const secondBarrier = new Client({ connectionString: apiDatabaseUrl });
    const firstClient = independentClient();
    const secondClient = independentClient();
    await Promise.all([firstBarrier.connect(), secondBarrier.connect()]);
    try {
      await Promise.all([
        firstBarrier.query('SELECT pg_advisory_lock(910011)'),
        secondBarrier.query('SELECT pg_advisory_lock(910012)'),
      ]);
      await installDualEventBarrier(
        firstEvent.id,
        910011,
        secondEvent.id,
        910012,
      );
      const config = { ...apiConfiguration, notificationWorkerTickLimit: 1 };
      const first = new NotificationOutboxWorker(
        { db: firstClient } as unknown as PrismaService,
        config,
      ).processTick();
      const second = new NotificationOutboxWorker(
        { db: secondClient } as unknown as PrismaService,
        config,
      ).processTick();
      await waitForLockWaitCount(2);
      expect(
        await apiPrisma.outboxEvent.count({
          where: {
            id: { in: [firstEvent.id, secondEvent.id] },
            publishedAt: null,
          },
        }),
      ).toBe(2);
      await Promise.all([
        firstBarrier.query('SELECT pg_advisory_unlock(910011)'),
        secondBarrier.query('SELECT pg_advisory_unlock(910012)'),
      ]);
      await Promise.all([first, second]);
      expect(
        await apiPrisma.outboxEvent.count({
          where: {
            id: { in: [firstEvent.id, secondEvent.id] },
            publishedAt: { not: null },
          },
        }),
      ).toBe(2);
    } finally {
      await Promise.all([
        firstBarrier.query('SELECT pg_advisory_unlock_all()'),
        secondBarrier.query('SELECT pg_advisory_unlock_all()'),
      ]);
      await Promise.all([
        firstBarrier.end(),
        secondBarrier.end(),
        firstClient.$disconnect(),
        secondClient.$disconnect(),
      ]);
      await removeEventBarrier('dual');
    }
  });

  it('certifies exact-clinic recipient inclusion and cross-clinic isolation', async () => {
    const seeded = await createSeededQueue(0);
    const receptionist = await createRolePrincipal(
      'receptionist',
      seeded.tenant,
    );
    const crossClinic = await apiPrisma.clinic.create({
      data: {
        organizationId: seeded.tenant.organizationId,
        name: 'Cross-clinic certification',
        code: `cross-${randomUUID()}`,
        timezone: 'Asia/Baghdad',
      },
    });
    const crossReceptionist = await createRolePrincipal('receptionist', {
      organizationId: seeded.tenant.organizationId,
      clinicId: crossClinic.id,
    });
    await apiPrisma.doctorClinicAssignment.create({
      data: {
        organizationId: seeded.tenant.organizationId,
        clinicId: crossClinic.id,
        doctorId: seeded.doctor.doctorId!,
      },
    });
    await apiPrisma.outboxEvent.updateMany({
      where: { publishedAt: null },
      data: { publishedAt: new Date(), attempts: 1 },
    });
    const includedEvent = await createQueueEvent(
      seeded,
      'queue.session.paused',
    );
    const worker = new NotificationOutboxWorker(
      { db: apiPrisma } as unknown as PrismaService,
      { ...apiConfiguration, notificationWorkerTickLimit: 1 },
    );
    await worker.processTick();
    const includedIds = (
      await apiPrisma.notificationRecord.findMany({
        where: { sourceOutboxEventId: includedEvent.id },
        select: { recipientUserId: true },
      })
    ).map(({ recipientUserId }) => recipientUserId);
    expect(includedIds).toEqual(
      expect.arrayContaining([
        seeded.doctor.userId,
        seeded.manager.userId,
        receptionist.userId,
      ]),
    );
    expect(includedIds).not.toContain(crossReceptionist.userId);

    await apiPrisma.doctorClinicAssignment.update({
      where: {
        organizationId_clinicId_doctorId: {
          organizationId: seeded.tenant.organizationId,
          clinicId: seeded.tenant.clinicId,
          doctorId: seeded.doctor.doctorId!,
        },
      },
      data: { status: 'inactive' },
    });
    await apiPrisma.user.update({
      where: { id: receptionist.userId },
      data: { status: 'inactive' },
    });
    await apiPrisma.staffAccount.delete({
      where: { userId: seeded.manager.userId },
    });
    const excludedEvent = await createQueueEvent(
      seeded,
      'queue.session.resumed',
    );
    await worker.processTick();
    const excludedIds = (
      await apiPrisma.notificationRecord.findMany({
        where: { sourceOutboxEventId: excludedEvent.id },
        select: { recipientUserId: true },
      })
    ).map(({ recipientUserId }) => recipientUserId);
    expect(excludedIds).not.toEqual(
      expect.arrayContaining([
        seeded.doctor.userId,
        seeded.manager.userId,
        receptionist.userId,
        crossReceptionist.userId,
      ]),
    );
    expect(excludedIds).toHaveLength(0);
  });
});

type RevocationRelationship =
  | 'clinic-manager-membership'
  | 'doctor-assignment'
  | 'patient-registration'
  | 'patient-ownership'
  | 'user'
  | 'staff-account';

async function certifyRevocationRace(
  relationship: RevocationRelationship,
  order: 'deactivation-first' | 'projection-first',
): Promise<void> {
  const seeded = await createSeededQueue(
    relationship === 'patient-registration' ||
      relationship === 'patient-ownership'
      ? 1
      : 0,
  );
  const recipientUserId =
    relationship === 'doctor-assignment'
      ? seeded.doctor.userId
      : relationship === 'patient-registration' ||
          relationship === 'patient-ownership'
        ? seeded.patient.userId
        : seeded.manager.userId;
  let updateSql: string;
  let blockedFragment: string;
  if (relationship === 'clinic-manager-membership') {
    updateSql = `UPDATE clinic_memberships SET status = 'inactive'
      WHERE organization_id = '${seeded.tenant.organizationId}'::uuid
        AND clinic_id = '${seeded.tenant.clinicId}'::uuid
        AND user_id = '${seeded.manager.userId}'::uuid
        AND role = 'clinicManager'`;
    blockedFragment = 'clinic_memberships';
  } else if (relationship === 'doctor-assignment') {
    updateSql = `UPDATE doctor_clinic_assignments SET status = 'inactive'
      WHERE organization_id = '${seeded.tenant.organizationId}'::uuid
        AND clinic_id = '${seeded.tenant.clinicId}'::uuid
        AND doctor_id = '${seeded.doctor.doctorId}'::uuid`;
    blockedFragment = 'doctor_clinic_assignments';
  } else if (relationship === 'patient-registration') {
    updateSql = `UPDATE organization_patient_profiles SET status = 'inactive'
      WHERE organization_id = '${seeded.tenant.organizationId}'::uuid
        AND patient_profile_id = '${seeded.profile.id}'::uuid`;
    blockedFragment = 'organization_patient_profiles';
  } else if (relationship === 'patient-ownership') {
    const foreign = await createRolePrincipal('patient', seeded.tenant);
    const foreignAccount = await apiPrisma.patientAccount.findUniqueOrThrow({
      where: { userId: foreign.userId },
    });
    await apiPrisma.user.update({
      where: { id: foreign.userId },
      data: { status: 'inactive' },
    });
    updateSql = `UPDATE patient_profiles
      SET patient_account_id = '${foreignAccount.id}'::uuid
      WHERE id = '${seeded.profile.id}'::uuid`;
    blockedFragment = 'patient_profiles';
  } else if (relationship === 'user') {
    updateSql = `UPDATE users SET status = 'inactive'
      WHERE id = '${seeded.manager.userId}'::uuid`;
    blockedFragment = 'users';
  } else {
    updateSql = `DELETE FROM staff_accounts
      WHERE user_id = '${seeded.manager.userId}'::uuid`;
    blockedFragment = 'staff_accounts';
  }
  let queueEntryId: string | null = null;
  if (
    relationship === 'patient-registration' ||
    relationship === 'patient-ownership'
  ) {
    const entry = await apiPrisma.queueEntry.findFirstOrThrow({
      where: { queueSessionId: seeded.session.id },
    });
    queueEntryId = entry.id;
    const calledAt = new Date();
    await apiPrisma.queueEntry.update({
      where: { id: entry.id },
      data: {
        status: 'called',
        calledAt,
        version: { increment: 1 },
      },
    });
    const consultationStartedAt = new Date(calledAt.getTime() + 1);
    await apiPrisma.queueEntry.update({
      where: { id: entry.id },
      data: {
        status: 'inConsultation',
        consultationStartedAt,
        version: { increment: 1 },
      },
    });
    await apiPrisma.queueEntry.update({
      where: { id: entry.id },
      data: {
        status: 'completed',
        completedAt: new Date(consultationStartedAt.getTime() + 1),
        version: { increment: 1 },
      },
    });
  }
  await apiPrisma.outboxEvent.updateMany({
    where: { publishedAt: null },
    data: { publishedAt: new Date(), attempts: 1 },
  });
  const event = await apiPrisma.outboxEvent.create({
    data: {
      aggregateType: 'QueueSession',
      aggregateId: seeded.session.id,
      eventType: queueEntryId
        ? 'queue.consultation.completed'
        : 'queue.session.paused',
      payload: {
        ...queuePayload(seeded),
        queueEntryId,
      },
      occurredAt: new Date(),
    },
  });
  const auditBefore = await apiPrisma.auditEvent.count();
  if (order === 'deactivation-first') {
    const deactivation = independentClient();
    const workerClient = independentClient();
    try {
      await deactivation.$executeRawUnsafe(updateSql);
      const worker = new NotificationOutboxWorker(
        { db: workerClient } as unknown as PrismaService,
        { ...apiConfiguration, notificationWorkerTickLimit: 1 },
      );
      await worker.processTick();
    } finally {
      await Promise.all([
        deactivation.$disconnect(),
        workerClient.$disconnect(),
      ]);
    }
    expect(
      await apiPrisma.notificationRecord.count({
        where: {
          sourceOutboxEventId: event.id,
          recipientUserId,
        },
      }),
    ).toBe(0);
  } else {
    const lockKey = 800_000 + Math.floor(Math.random() * 100_000);
    const barrier = new Client({ connectionString: apiDatabaseUrl });
    const workerClient = independentClient();
    const deactivationClient = new Client({
      connectionString: apiDatabaseUrl,
    });
    await barrier.connect();
    await deactivationClient.connect();
    const deactivationPid = (
      await deactivationClient.query<{ pid: number }>(
        'SELECT pg_backend_pid() AS pid',
      )
    ).rows[0]!.pid;
    try {
      await barrier.query('SELECT pg_advisory_lock($1)', [lockKey]);
      await apiPrisma.$executeRawUnsafe(`
        CREATE OR REPLACE FUNCTION notification_revocation_barrier()
        RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          IF NEW.source_outbox_event_id = '${event.id}'::uuid THEN
            PERFORM pg_advisory_xact_lock(${lockKey});
          END IF;
          RETURN NEW;
        END
        $$;
        CREATE TRIGGER notification_revocation_barrier_trigger
        BEFORE INSERT ON notification_records
        FOR EACH ROW EXECUTE FUNCTION notification_revocation_barrier();
      `);
      const worker = new NotificationOutboxWorker(
        { db: workerClient } as unknown as PrismaService,
        { ...apiConfiguration, notificationWorkerTickLimit: 1 },
      );
      const projection = worker.processTick();
      await waitUntilBlocked('notification_records');
      let deactivationCommitted = false;
      const deactivation = deactivationClient.query(updateSql).then(() => {
        deactivationCommitted = true;
      });
      await waitUntilPidBlocked(deactivationPid, blockedFragment);
      expect(deactivationCommitted).toBe(false);
      await barrier.query('SELECT pg_advisory_unlock($1)', [lockKey]);
      await projection;
      await deactivation;
    } finally {
      await barrier.query('SELECT pg_advisory_unlock_all()');
      await barrier.end();
      await Promise.all([workerClient.$disconnect(), deactivationClient.end()]);
      await apiPrisma.$executeRawUnsafe(`
        DROP TRIGGER IF EXISTS notification_revocation_barrier_trigger
          ON notification_records;
        DROP FUNCTION IF EXISTS notification_revocation_barrier();
      `);
    }
    expect(
      await apiPrisma.notificationRecord.count({
        where: {
          sourceOutboxEventId: event.id,
          recipientUserId,
        },
      }),
    ).toBe(1);
  }
  const outbox = await apiPrisma.outboxEvent.findUniqueOrThrow({
    where: { id: event.id },
  });
  expect(outbox).toMatchObject({
    attempts: 1,
    failedAt: null,
    lastErrorCode: null,
  });
  expect(outbox.publishedAt).not.toBeNull();
  expect(
    await apiPrisma.notificationRecord.count({
      where: {
        sourceOutboxEventId: event.id,
        recipientUserId,
      },
    }),
  ).toBe(order === 'projection-first' ? 1 : 0);
  expect(await apiPrisma.auditEvent.count()).toBe(auditBefore);
}

async function waitUntilBlocked(queryFragment: string): Promise<void> {
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const [row] = await apiPrisma.$queryRaw<{ waiting: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM pg_stat_activity
        WHERE datname = current_database()
          AND wait_event_type = 'Lock'
          AND query ILIKE ${`%${queryFragment}%`}
      ) AS waiting
    `;
    if (row?.waiting) return;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error('Expected database lock wait was not observed.');
}

async function waitUntilPidBlocked(
  processId: number,
  queryFragment: string,
): Promise<void> {
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const [row] = await apiPrisma.$queryRaw<{ waiting: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM pg_stat_activity
        WHERE pid = ${processId}
          AND wait_event_type = 'Lock'
          AND query ILIKE ${`%${queryFragment}%`}
      ) AS waiting
    `;
    if (row?.waiting) return;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error('Expected deactivation lock wait was not observed.');
}

function independentClient(): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: apiDatabaseUrl }),
  });
}

function queuePayload(
  seeded: Awaited<ReturnType<typeof createSeededQueue>>,
): Record<string, string | null> {
  return {
    organizationId: seeded.tenant.organizationId,
    clinicId: seeded.tenant.clinicId,
    queueSessionId: seeded.session.id,
    queueEntryId: null,
  };
}

async function createQueueEvent(
  seeded: Awaited<ReturnType<typeof createSeededQueue>>,
  eventType: 'queue.session.paused' | 'queue.session.resumed',
) {
  return apiPrisma.outboxEvent.create({
    data: {
      aggregateType: 'QueueSession',
      aggregateId: seeded.session.id,
      eventType,
      payload: queuePayload(seeded),
      occurredAt: new Date(),
    },
  });
}

async function installEventBarrier(
  eventId: string,
  lockKey: number,
  suffix: string,
): Promise<void> {
  await apiPrisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION notification_${suffix}_barrier()
    RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF NEW.source_outbox_event_id = '${eventId}'::uuid THEN
        PERFORM pg_advisory_xact_lock(${lockKey});
      END IF;
      RETURN NEW;
    END
    $$;
    CREATE TRIGGER notification_${suffix}_barrier_trigger
    BEFORE INSERT ON notification_records
    FOR EACH ROW EXECUTE FUNCTION notification_${suffix}_barrier();
  `);
}

async function installDualEventBarrier(
  firstEventId: string,
  firstLockKey: number,
  secondEventId: string,
  secondLockKey: number,
): Promise<void> {
  await apiPrisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION notification_dual_barrier()
    RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF NEW.source_outbox_event_id = '${firstEventId}'::uuid THEN
        PERFORM pg_advisory_xact_lock(${firstLockKey});
      ELSIF NEW.source_outbox_event_id = '${secondEventId}'::uuid THEN
        PERFORM pg_advisory_xact_lock(${secondLockKey});
      END IF;
      RETURN NEW;
    END
    $$;
    CREATE TRIGGER notification_dual_barrier_trigger
    BEFORE INSERT ON notification_records
    FOR EACH ROW EXECUTE FUNCTION notification_dual_barrier();
  `);
}

async function removeEventBarrier(suffix: string): Promise<void> {
  await apiPrisma.$executeRawUnsafe(`
    DROP TRIGGER IF EXISTS notification_${suffix}_barrier_trigger
      ON notification_records;
    DROP FUNCTION IF EXISTS notification_${suffix}_barrier();
  `);
}

async function waitForLockWaitCount(expected: number): Promise<void> {
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const [row] = await apiPrisma.$queryRaw<{ waiting: bigint }[]>`
      SELECT COUNT(*)::bigint AS waiting
      FROM pg_stat_activity
      WHERE datname = current_database()
        AND wait_event_type = 'Lock'
    `;
    if (Number(row?.waiting ?? 0) >= expected) return;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error('Expected concurrent database lock waits were not observed.');
}
