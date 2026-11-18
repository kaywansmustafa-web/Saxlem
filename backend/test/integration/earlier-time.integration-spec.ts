/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { createApplication } from '../../src/main';
import {
  apiConfiguration,
  apiPrisma,
  createRolePrincipal,
  createSeededQueue,
} from './live-queue-api-fixture';

jest.setTimeout(30_000);

describe('earlier time requests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApplication(apiConfiguration);
    await app.init();
  });
  afterAll(async () => {
    await app.close();
    await apiPrisma.$disconnect();
  });

  it('a patient watches their own upcoming visit, and can stop', async () => {
    const seeded = await createSeededQueue(0);
    const { organizationId, clinicId } = seeded.tenant;
    const visit = (hours: number) =>
      apiPrisma.appointment.create({
        data: {
          organizationId,
          clinicId,
          doctorId: seeded.doctor.doctorId!,
          patientProfileId: seeded.profile.id,
          origin: 'patientBooked',
          startsAt: new Date(Date.now() + hours * 3_600_000),
          endsAt: new Date(Date.now() + hours * 3_600_000 + 30 * 60_000),
          durationMinutes: 30,
          feeIqd: 25000,
          status: 'confirmed',
        },
      });
    const later = await visit(48);
    const soon = await visit(1);
    const server = app.getHttpServer();
    const path = (id: string) => `/api/v1/appointments/${id}/earlier`;
    const as = (token: string) => ({ authorization: `Bearer ${token}` });

    const before = await request(server)
      .get(path(later.id))
      .set(as(seeded.patient.token))
      .expect(200);
    expect(before.body).toEqual({ watching: false, offer: null });
    await request(server)
      .post(path(soon.id))
      .set(as(seeded.patient.token))
      .expect(409);
    const stranger = await createRolePrincipal('patient', seeded.tenant);
    await request(server)
      .post(path(later.id))
      .set(as(stranger.token))
      .expect(404);
    const watching = await request(server)
      .post(path(later.id))
      .set(as(seeded.patient.token))
      .expect(200);
    expect(watching.body).toEqual({ watching: true, offer: null });
    // Asking twice is fine.
    await request(server)
      .post(path(later.id))
      .set(as(seeded.patient.token))
      .expect(200);
    await request(server)
      .delete(path(later.id))
      .set(as(seeded.patient.token))
      .expect(204);
    expect(
      await apiPrisma.earlierTimeRequest.count({
        where: { appointmentId: later.id },
      }),
    ).toBe(0);
  });
});
