/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { createApplication } from '../../src/main';
import {
  apiConfiguration,
  apiPrisma,
  createRolePrincipal,
  createSeededQueue,
} from './live-queue-api-fixture';

describe('clinic location', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApplication(apiConfiguration);
    await app.init();
  });
  afterAll(async () => {
    await app.close();
    await apiPrisma.$disconnect();
  });

  it('lets the platform set it and patients read it, nothing more', async () => {
    const seeded = await createSeededQueue(0);
    const platform = await createRolePrincipal(
      'platformAdministrator',
      seeded.tenant,
    );
    const clinicId = seeded.tenant.clinicId;
    const path = `/api/v1/administration/clinics/${clinicId}/location`;
    const location = {
      address: 'Kurdistan St, near the Grand Bazaar',
      area: 'Nakhoshkhana',
      city: 'Duhok',
      latitude: 36.8669,
      longitude: 42.9886,
      phoneNumber: '0750 123 4567',
    };

    // A patient cannot change it.
    await request(app.getHttpServer())
      .put(path)
      .set('authorization', `Bearer ${seeded.patient.token}`)
      .send(location)
      .expect(403);
    // Half a map pin is refused.
    await request(app.getHttpServer())
      .put(path)
      .set('authorization', `Bearer ${platform.token}`)
      .send({ latitude: 36.8 })
      .expect(400);
    const saved = await request(app.getHttpServer())
      .put(path)
      .set('authorization', `Bearer ${platform.token}`)
      .send(location)
      .expect(200);
    expect(saved.body.phoneNumber).toBe('07501234567');

    const seen = await request(app.getHttpServer())
      .get(`/api/v1/doctors/clinics/${clinicId}/location`)
      .set('authorization', `Bearer ${seeded.patient.token}`)
      .expect(200);
    expect(seen.body).toEqual({
      id: clinicId,
      name: expect.any(String),
      address: location.address,
      area: location.area,
      city: location.city,
      latitude: location.latitude,
      longitude: location.longitude,
      phoneNumber: '07501234567',
    });
    expect(Object.keys(seen.body)).not.toContain('organizationId');

    // A clinic nobody works at is not public.
    await apiPrisma.doctorClinicAssignment.updateMany({
      where: { clinicId },
      data: { status: 'inactive' },
    });
    await request(app.getHttpServer())
      .get(`/api/v1/doctors/clinics/${clinicId}/location`)
      .set('authorization', `Bearer ${seeded.patient.token}`)
      .expect(404);
    expect(
      await apiPrisma.auditEvent.count({
        where: {
          action: 'administration.clinic.location.updated',
          targetId: clinicId,
        },
      }),
    ).toBe(1);
  });
});
