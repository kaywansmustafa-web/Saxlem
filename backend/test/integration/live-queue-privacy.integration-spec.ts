/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import {
  apiPrisma,
  createQueueApiApplication,
  createRolePrincipal,
  createSeededQueue,
  expectErrorEnvelope,
} from './live-queue-api-fixture';

describe('live queue DTO and persisted metadata privacy certification', () => {
  let app: INestApplication<App>;
  let fixture: Awaited<ReturnType<typeof createSeededQueue>>;

  beforeAll(async () => {
    app = await createQueueApiApplication();
    fixture = await createSeededQueue(2);
  });

  afterAll(async () => {
    await app.close();
    await apiPrisma.$disconnect();
  });

  it('returns the exact patient queue status allowlist only to its owner', async () => {
    const appointment = fixture.appointments[0]!;
    const own = await request(app.getHttpServer())
      .get(`/api/v1/appointments/${appointment.id}/queue-status`)
      .set('Authorization', `Bearer ${fixture.patient.token}`);
    expect(own.status).toBe(200);
    expect(Object.keys(own.body).sort()).toEqual(
      [
        'appointmentReference',
        'clinic',
        'currentTicket',
        'doctor',
        'estimateSuspended',
        'estimatedWait',
        'instruction',
        'lastUpdatedAt',
        'patientsAhead',
        'queueHealth',
        'queueState',
        'status',
        'ticketNumber',
      ].sort(),
    );
    expect(Object.keys(own.body.doctor).sort()).toEqual(['id', 'name']);
    expect(Object.keys(own.body.clinic).sort()).toEqual(['id', 'name']);
    expect(JSON.stringify(own.body)).not.toContain(fixture.profile.id);
    expect(JSON.stringify(own.body)).not.toContain(fixture.appointments[1]!.id);

    const foreignPatient = await createRolePrincipal('patient', fixture.tenant);
    const foreign = await request(app.getHttpServer())
      .get(`/api/v1/appointments/${appointment.id}/queue-status`)
      .set('Authorization', `Bearer ${foreignPatient.token}`);
    expect(foreign.status).toBe(404);
    expectErrorEnvelope(foreign.body, 404);
  });

  it('uses exact staff session and entry summary allowlists', async () => {
    const session = await request(app.getHttpServer())
      .get(`/api/v1/queue-sessions/${fixture.session.id}`)
      .set('Authorization', `Bearer ${fixture.manager.token}`);
    expect(session.status).toBe(200);
    expect(Object.keys(session.body).sort()).toEqual(
      [
        'currentPatient',
        'id',
        'status',
        'updatedAt',
        'version',
        'waitingCount',
      ].sort(),
    );
    const page = await request(app.getHttpServer())
      .get(`/api/v1/queue-sessions/${fixture.session.id}/entries`)
      .set('Authorization', `Bearer ${fixture.manager.token}`);
    expect(page.status).toBe(200);
    expect(Object.keys(page.body).sort()).toEqual(['items', 'nextCursor']);
    for (const entry of page.body.items) {
      expect(Object.keys(entry).sort()).toEqual(
        [
          'appointmentId',
          'calledAt',
          'completedAt',
          'consultationStartedAt',
          'enqueuedAt',
          'entryId',
          'noResponseAt',
          'patientDisplayName',
          'patientProfileId',
          'queueSessionId',
          'status',
          'ticketNumber',
          'version',
        ].sort(),
      );
      expect(entry.patientDisplayName).toBe('Private Patient');
      expect(entry.patientProfileId).toBe(fixture.profile.id);
      expect(entry.queueSessionId).toBe(fixture.session.id);
      expect(JSON.stringify(entry)).not.toMatch(
        /phone|dateOfBirth|reason|clinical|address|appointmentReference/,
      );
    }
  });

  it('stores no patient names, phone, visit reason, notes, tokens, or secrets in queue side-effect payloads', async () => {
    const entries = await apiPrisma.queueEntry.findMany({
      where: { queueSessionId: fixture.session.id },
      select: { appointmentId: true },
    });
    const appointmentIds = entries.map(({ appointmentId }) => appointmentId);
    const [activities, queueAudits, appointmentAudits, audits, outbox, keys] =
      await Promise.all([
        apiPrisma.queueActivity.findMany({
          where: { queueSessionId: fixture.session.id },
        }),
        apiPrisma.queueAudit.findMany({
          where: { queueSessionId: fixture.session.id },
        }),
        apiPrisma.auditEvent.findMany({
          where: { targetId: { in: appointmentIds } },
        }),
        apiPrisma.auditEvent.findMany({
          where: { targetId: fixture.session.id },
        }),
        apiPrisma.outboxEvent.findMany({
          where: {
            OR: [
              { aggregateId: fixture.session.id },
              { aggregateId: { in: appointmentIds } },
            ],
          },
        }),
        apiPrisma.idempotencyRecord.findMany({
          where: { scope: { contains: fixture.session.id } },
        }),
      ]);
    const stored = JSON.stringify({
      activities,
      queueAudits,
      appointmentAudits,
      audits,
      outbox,
      keys: keys.map(({ responseBody }) => responseBody),
    }).toLowerCase();
    for (const prohibited of [
      'private',
      '+964',
      'general consultation',
      'staff note',
      'bearer ',
      'access_token',
      'refresh_token',
      'secret',
    ])
      expect(stored).not.toContain(prohibited);
  });
});
