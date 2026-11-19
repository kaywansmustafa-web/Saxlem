/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { createApplication } from '../../src/main';
import type { PrismaService } from '../../src/infrastructure/database/prisma.service';
import { TripLearningService } from '../../src/modules/appointments/application/trip-learning.service';
import {
  apiConfiguration,
  apiPrisma,
  createSeededQueue,
} from './live-queue-api-fixture';

jest.setTimeout(30_000);

describe('"I\'m on my way" and learning real drive times', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApplication(apiConfiguration);
    await app.init();
  });
  afterAll(async () => {
    await app.close();
    await apiPrisma.$disconnect();
  });

  it('tells reception, keeps no position, and learns from the check-in', async () => {
    const seeded = await createSeededQueue(0);
    const { organizationId, clinicId } = seeded.tenant;
    await apiPrisma.clinic.update({
      where: { id: clinicId },
      data: { latitude: 36.8669, longitude: 42.9886, city: 'Duhok' },
    });
    const now = Date.now();
    const appointment = await apiPrisma.appointment.create({
      data: {
        organizationId,
        clinicId,
        doctorId: seeded.doctor.doctorId!,
        patientProfileId: seeded.profile.id,
        origin: 'patientBooked',
        startsAt: new Date(now + 60 * 60_000),
        endsAt: new Date(now + 75 * 60_000),
        durationMinutes: 15,
        feeIqd: 25000,
        status: 'confirmed',
      },
    });
    const arrival = await apiPrisma.appointmentArrival.create({
      data: {
        organizationId,
        clinicId,
        appointmentId: appointment.id,
        patientProfileId: seeded.profile.id,
      },
    });
    const home = { latitude: 36.85, longitude: 42.95 };
    const post = (path: string, token: string) =>
      request(app.getHttpServer())
        .post(`/api/v1/appointments/${appointment.id}/${path}`)
        .set('authorization', `Bearer ${token}`)
        .send(home);

    await post('on-the-way', seeded.doctor.token).expect(403);
    const trip = await post('on-the-way', seeded.patient.token).expect(200);
    expect(trip.body).toEqual({
      onTheWayAt: expect.any(String),
      arrivalEta: expect.any(String),
      travelSeconds: expect.any(Number),
      distanceMeters: expect.any(Number),
      source: 'estimate',
    });

    // Reception sees when to expect them.
    const seen = await request(app.getHttpServer())
      .get(`/api/v1/appointments/${appointment.id}`)
      .set('authorization', `Bearer ${seeded.manager.token}`)
      .expect(200);
    expect(seen.body.onTheWayEta).toBe(trip.body.arrivalEta);

    // Nothing kept could place the patient.
    const stored = await apiPrisma.appointmentTrip.findUniqueOrThrow({
      where: { appointmentId: appointment.id },
    });
    expect(JSON.stringify(stored)).not.toMatch(/36\.85|42\.95/);

    // They arrive taking 1.4× the routed drive (plus 5 min to park).
    const startedAt = stored.startedAt.getTime();
    await apiPrisma.appointmentArrival.update({
      where: { id: arrival.id },
      data: {
        status: 'arrived',
        arrivedAt: new Date(
          startedAt + stored.routeSeconds * 1400 + 5 * 60_000,
        ),
        version: { increment: 1 },
      },
    });
    const learning = new TripLearningService({
      db: apiPrisma,
    } as unknown as PrismaService);
    expect(await learning.collect()).toBe(1);
    expect(
      await apiPrisma.appointmentTrip.count({
        where: { appointmentId: appointment.id },
      }),
    ).toBe(0);
    const totals = await apiPrisma.driveTimeLearning.findMany({
      where: { clinicId },
    });
    expect(totals).toHaveLength(1);
    expect(totals[0]!.trips).toBe(1);
    expect(totals[0]!.sumLogRatio).toBeCloseTo(Math.log(1.4), 2);
    const after = await request(app.getHttpServer())
      .get(`/api/v1/appointments/${appointment.id}`)
      .set('authorization', `Bearer ${seeded.manager.token}`)
      .expect(200);
    expect(after.body.onTheWayEta).toBeNull();
  });

  it('once enough trips agree, "when to leave" uses them', async () => {
    const seeded = await createSeededQueue(0);
    const { organizationId, clinicId } = seeded.tenant;
    await apiPrisma.clinic.update({
      where: { id: clinicId },
      data: {
        latitude: 36.8669,
        longitude: 42.9886,
        city: `Learning ${clinicId}`,
      },
    });
    const now = Date.now();
    const appointment = await apiPrisma.appointment.create({
      data: {
        organizationId,
        clinicId,
        doctorId: seeded.doctor.doctorId!,
        patientProfileId: seeded.profile.id,
        origin: 'patientBooked',
        startsAt: new Date(now + 3 * 3_600_000),
        endsAt: new Date(now + 3 * 3_600_000 + 15 * 60_000),
        durationMinutes: 15,
        feeIqd: 25000,
        status: 'confirmed',
      },
    });
    const plan = () =>
      request(app.getHttpServer())
        .post(`/api/v1/appointments/${appointment.id}/departure`)
        .set('authorization', `Bearer ${seeded.patient.token}`)
        .send({ latitude: 36.85, longitude: 42.95 })
        .expect(200);
    const before = await plan();
    expect(before.body.source).toBe('estimate');
    // Twelve past trips at every hour, 1.5× the estimate (short distance).
    await apiPrisma.driveTimeLearning.createMany({
      data: [0, 1].flatMap((dayKind) =>
        Array.from({ length: 24 }, (_, hour) => ({
          organizationId,
          clinicId,
          basis: 1,
          distanceBand: 0,
          dayKind,
          hour,
          trips: 12,
          sumLogRatio: 12 * Math.log(1.5),
        })),
      ),
    });
    const learned = await plan();
    expect(learned.body.source).toBe('learned');
    const factor = learned.body.travelSeconds / before.body.travelSeconds;
    expect(factor).toBeGreaterThan(1.3);
    expect(factor).toBeLessThan(1.5);
  });
});
