/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { createApplication } from '../../src/main';
import {
  apiConfiguration,
  apiPrisma,
  createRolePrincipal,
  createSeededQueue,
} from './live-queue-api-fixture';

describe('when to leave for a visit', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApplication(apiConfiguration);
    await app.init();
  });
  afterAll(async () => {
    await app.close();
    await apiPrisma.$disconnect();
  });

  it('plans the departure for the patient’s own visit only, and stores nothing', async () => {
    const seeded = await createSeededQueue(1);
    const appointment = await apiPrisma.appointment.findFirstOrThrow({
      where: { clinicId: seeded.tenant.clinicId },
    });
    const path = `/api/v1/appointments/${appointment.id}/departure`;
    const home = { latitude: 36.85, longitude: 42.95 };
    const ask = (token: string, body: object = home) =>
      request(app.getHttpServer())
        .post(path)
        .set('authorization', `Bearer ${token}`)
        .send(body);

    // No map pin yet (the app checks the clinic's location first).
    await ask(seeded.patient.token).expect(409);

    await apiPrisma.clinic.update({
      where: { id: seeded.tenant.clinicId },
      data: { latitude: 36.8669, longitude: 42.9886 },
    });
    const before = await apiPrisma.auditEvent.count();
    const plan = await ask(seeded.patient.token).expect(200);
    expect(plan.body).toEqual({
      leaveAt: expect.any(String),
      arriveBy: expect.any(String),
      travelSeconds: expect.any(Number),
      distanceMeters: expect.any(Number),
      source: 'estimate',
      parkAndWalkMinutes: 5,
      computedAt: expect.any(String),
    });
    // A first visit: be at reception 10 minutes early.
    expect(Date.parse(plan.body.arriveBy)).toBe(
      appointment.startsAt.getTime() - 10 * 60_000,
    );
    expect(Date.parse(plan.body.leaveAt)).toBe(
      Date.parse(plan.body.arriveBy) -
        5 * 60_000 -
        plan.body.travelSeconds * 1000,
    );
    expect(plan.body.distanceMeters).toBeGreaterThan(3000);
    // The patient's location is not written anywhere.
    expect(await apiPrisma.auditEvent.count()).toBe(before);

    await ask(seeded.patient.token, { latitude: 200, longitude: 0 }).expect(
      400,
    );
    await ask(seeded.doctor.token).expect(403);
    const stranger = await createRolePrincipal('patient', seeded.tenant);
    await ask(stranger.token).expect(404);
  });
});
