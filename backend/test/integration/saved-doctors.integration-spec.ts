/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { createApplication } from '../../src/main';
import {
  apiConfiguration,
  apiPrisma,
  createRolePrincipal,
  createSeededQueue,
} from './live-queue-api-fixture';

jest.setTimeout(30_000);

describe('saved doctors', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApplication(apiConfiguration);
    await app.init();
  });
  afterAll(async () => {
    await app.close();
    await apiPrisma.$disconnect();
  });

  it('a patient keeps doctors they can see, once each, and removes them', async () => {
    const seeded = await createSeededQueue(0);
    const doctorId = seeded.doctor.doctorId!;
    const specialty = await apiPrisma.specialty.create({
      data: { code: `saved-${randomUUID()}`, displayName: 'Cardiology' },
    });
    await apiPrisma.doctorSpecialtyAssignment.create({
      data: { doctorId, specialtyId: specialty.id, isPrimary: true },
    });
    const server = app.getHttpServer();
    const as = (token: string) => ({ authorization: `Bearer ${token}` });
    const path = `/api/v1/patients/me/saved-doctors`;

    await request(server)
      .post(`${path}/${doctorId}`)
      .set(as(seeded.manager.token))
      .expect(403);
    await request(server)
      .post(`${path}/${randomUUID()}`)
      .set(as(seeded.patient.token))
      .expect(404);
    await request(server)
      .post(`${path}/${doctorId}`)
      .set(as(seeded.patient.token))
      .expect(204);
    await request(server)
      .post(`${path}/${doctorId}`)
      .set(as(seeded.patient.token))
      .expect(204);
    const list = await request(server)
      .get(path)
      .set(as(seeded.patient.token))
      .expect(200);
    expect(list.body.items).toHaveLength(1);
    expect(list.body.items[0].id).toBe(doctorId);
    expect(list.body.items[0].rating).toEqual({ average: 0, count: 0 });

    // Another patient's list is their own.
    const other = await createRolePrincipal('patient', seeded.tenant);
    const theirs = await request(server)
      .get(path)
      .set(as(other.token))
      .expect(200);
    expect(theirs.body.items).toEqual([]);

    await request(server)
      .delete(`${path}/${doctorId}`)
      .set(as(seeded.patient.token))
      .expect(204);
    await request(server)
      .delete(`${path}/${doctorId}`)
      .set(as(seeded.patient.token))
      .expect(204);
    const empty = await request(server)
      .get(path)
      .set(as(seeded.patient.token))
      .expect(200);
    expect(empty.body.items).toEqual([]);
  });
});
