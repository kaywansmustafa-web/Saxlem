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

jest.setTimeout(30_000);

describe('verified reviews', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApplication(apiConfiguration);
    await app.init();
  });
  afterAll(async () => {
    await app.close();
    await apiPrisma.$disconnect();
  });

  it('only the patient who had the visit rates it; Saxlem can hide it', async () => {
    const seeded = await createSeededQueue(0);
    const { organizationId, clinicId } = seeded.tenant;
    const doctorId = seeded.doctor.doctorId!;
    const visit = (status: 'completed' | 'confirmed', daysAgo: number) =>
      apiPrisma.appointment.create({
        data: {
          organizationId,
          clinicId,
          doctorId,
          patientProfileId: seeded.profile.id,
          origin: 'patientBooked',
          startsAt: new Date(Date.now() - daysAgo * 86_400_000),
          endsAt: new Date(Date.now() - daysAgo * 86_400_000 + 15 * 60_000),
          durationMinutes: 15,
          feeIqd: 25000,
          status,
        },
      });
    const done = await visit('completed', 2);
    const upcoming = await visit('confirmed', -2);
    const old = await visit('completed', 40);
    const server = app.getHttpServer();
    const put = (id: string, token: string, body: object) =>
      request(server)
        .post(`/api/v1/appointments/${id}/review`)
        .set('authorization', `Bearer ${token}`)
        .send(body);

    const before = await request(server)
      .get(`/api/v1/appointments/${done.id}/review`)
      .set('authorization', `Bearer ${seeded.patient.token}`)
      .expect(200);
    expect(before.body).toMatchObject({ canReview: true, review: null });

    await put(done.id, seeded.doctor.token, {
      rating: 5,
      anonymous: false,
    }).expect(403);
    const stranger = await createRolePrincipal('patient', seeded.tenant);
    await put(done.id, stranger.token, { rating: 5, anonymous: false }).expect(
      404,
    );
    await put(upcoming.id, seeded.patient.token, {
      rating: 5,
      anonymous: false,
    }).expect(409);
    await put(old.id, seeded.patient.token, {
      rating: 5,
      anonymous: false,
    }).expect(409);
    await put(done.id, seeded.patient.token, {
      rating: 4,
      comment: 'Call me 0750 123 4567',
      anonymous: false,
    }).expect(400);
    await put(done.id, seeded.patient.token, {
      rating: 6,
      anonymous: false,
    }).expect(400);

    const written = await put(done.id, seeded.patient.token, {
      rating: 4,
      comment: '  Kind and   clear. ',
      anonymous: false,
    }).expect(200);
    expect(written.body).toMatchObject({
      rating: 4,
      comment: 'Kind and clear.',
      status: 'published',
    });
    // Changing it keeps one review.
    await put(done.id, seeded.patient.token, {
      rating: 5,
      comment: 'Kind and clear.',
      anonymous: false,
    }).expect(200);

    const page: { body: { summary: unknown; items: unknown } } = await request(
      server,
    )
      .get(`/api/v1/doctors/${doctorId}/reviews`)
      .set('authorization', `Bearer ${stranger.token}`)
      .expect(200);
    expect(page.body.summary).toEqual({
      average: 5,
      count: 1,
      distribution: [0, 0, 0, 0, 1],
    });
    expect(page.body.items).toEqual([
      {
        id: written.body.id,
        rating: 5,
        comment: 'Kind and clear.',
        author: 'Private P.',
        createdAt: expect.any(String),
      },
    ]);
    // The totals the doctor directory shows.
    expect(
      await apiPrisma.doctorReviewStats.findUnique({ where: { doctorId } }),
    ).toMatchObject({ reviewCount: 1, reviewSum: 5 });

    const platform = await createRolePrincipal(
      'platformAdministrator',
      seeded.tenant,
    );
    const queue = await request(server)
      .get('/api/v1/platform/reviews?status=published')
      .set('authorization', `Bearer ${platform.token}`)
      .expect(200);
    const items = queue.body.items as { id: string }[];
    expect(items.find((item) => item.id === written.body.id)).toMatchObject({
      authorName: 'Private P.',
      anonymous: false,
    });
    await request(server)
      .put(`/api/v1/platform/reviews/${written.body.id}/status`)
      .set('authorization', `Bearer ${seeded.patient.token}`)
      .send({ status: 'hidden' })
      .expect(403);
    await request(server)
      .put(`/api/v1/platform/reviews/${written.body.id}/status`)
      .set('authorization', `Bearer ${platform.token}`)
      .send({ status: 'hidden' })
      .expect(204);
    const hidden = await request(server)
      .get(`/api/v1/doctors/${doctorId}/reviews`)
      .set('authorization', `Bearer ${stranger.token}`)
      .expect(200);
    expect(hidden.body.summary.count).toBe(0);
    expect(
      await apiPrisma.doctorReviewStats.findUnique({ where: { doctorId } }),
    ).toMatchObject({ reviewCount: 0, reviewSum: 0 });
    expect(hidden.body.items).toEqual([]);
    // A hidden review can't be put back by editing it.
    await put(done.id, seeded.patient.token, {
      rating: 5,
      anonymous: true,
    }).expect(409);
  });
});
