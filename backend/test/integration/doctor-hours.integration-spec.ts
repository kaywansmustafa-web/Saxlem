/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { createApplication } from '../../src/main';
import {
  apiConfiguration,
  apiPrisma,
  createRolePrincipal,
  createSeededQueue,
} from './live-queue-api-fixture';

jest.setTimeout(60_000);

/** "2026-11-20" for today + n days, Baghdad time. */
const day = (n: number) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Baghdad' }).format(
    new Date(Date.now() + n * 86_400_000),
  );
const everyDay = (from: number, to: number) =>
  Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    startsMinute: from,
    endsMinute: to,
  }));

describe('doctor hours from the Owner Portal', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApplication(apiConfiguration);
    await app.init();
  });
  afterAll(async () => {
    await apiPrisma.platformSetting.deleteMany({});
    await app.close();
    await apiPrisma.$disconnect();
  });

  it('sets hours, visit length, switches and time off; booking follows', async () => {
    const seeded = await createSeededQueue(0);
    const owner = await createRolePrincipal(
      'platformAdministrator',
      seeded.tenant,
    );
    const server = app.getHttpServer();
    const as = (token: string) => ({ authorization: `Bearer ${token}` });
    const doctorId = seeded.doctor.doctorId!;
    const { clinicId, organizationId } = seeded.tenant;
    const hoursPath = `/api/v1/platform/doctors/${doctorId}/hours`;
    const options = (
      type: 'initial' | 'followUp',
      from = day(1),
      to = day(3),
    ) =>
      request(server)
        .get(`/api/v1/doctors/${doctorId}/booking-options`)
        .query({
          clinicId,
          patientProfileId: seeded.profile.id,
          appointmentType: type,
          dateFrom: from,
          dateTo: to,
        })
        .set(as(seeded.patient.token))
        .expect(200);
    const slots = (body: {
      days: { slots: { durationMinutes: number }[] }[];
    }) => body.days.flatMap((d) => d.slots);

    // Patients find doctors through a specialty.
    const letters = Array.from({ length: 6 }, () =>
      String.fromCharCode(97 + Math.floor(Math.random() * 26)),
    ).join('');
    const specialty = await request(server)
      .post('/api/v1/platform/catalog/specialties')
      .set(as(owner.token))
      .send({ nameEn: `Hours ${letters}` })
      .expect(201);
    await request(server)
      .put(`/api/v1/platform/doctors/${doctorId}/specialties`)
      .set(as(owner.token))
      .send({
        specialtyIds: [specialty.body.id],
        primarySpecialtyId: specialty.body.id,
      })
      .expect(204);

    await request(server)
      .get(hoursPath)
      .set(as(seeded.manager.token))
      .expect(403);
    const before = await request(server)
      .get(hoursPath)
      .set(as(owner.token))
      .expect(200);
    expect(before.body).toMatchObject({
      visitMinutes: null,
      defaultVisitMinutes: 30,
      bookable: true,
      acceptingNewPatients: true,
      clinics: [{ clinicId, weekly: [], breaks: [], leave: [] }],
    });
    // No hours yet: nothing to book.
    expect(slots((await options('initial')).body)).toEqual([]);

    // Refused: overlaps, a break outside hours, odd minutes.
    await request(server)
      .put(`${hoursPath}/${clinicId}`)
      .set(as(owner.token))
      .send({
        weekly: [
          ...everyDay(480, 720),
          { weekday: 1, startsMinute: 700, endsMinute: 800 },
        ],
        breaks: [],
      })
      .expect(400);
    await request(server)
      .put(`${hoursPath}/${clinicId}`)
      .set(as(owner.token))
      .send({
        weekly: everyDay(480, 720),
        breaks: [{ weekday: 1, startsMinute: 780, endsMinute: 840 }],
      })
      .expect(400);
    await request(server)
      .put(`${hoursPath}/${clinicId}`)
      .set(as(owner.token))
      .send({
        weekly: [{ weekday: 1, startsMinute: 481, endsMinute: 720 }],
        breaks: [],
      })
      .expect(400);

    // Doctors work inside the clinic's opening hours.
    const clinicHours = `/api/v1/platform/clinics/${clinicId}/hours`;
    await request(server)
      .put(`${hoursPath}/${clinicId}`)
      .set(as(owner.token))
      .send({ weekly: everyDay(480, 1200), breaks: [] })
      .expect(400);
    await request(server)
      .put(clinicHours)
      .set(as(seeded.manager.token))
      .send({ periods: everyDay(420, 1260) })
      .expect(403);
    await request(server)
      .put(clinicHours)
      .set(as(owner.token))
      .send({ periods: everyDay(420, 1260) })
      .expect(204);

    // 08:00–20:00 every day with a 12:00–13:00 break.
    await request(server)
      .put(`${hoursPath}/${clinicId}`)
      .set(as(owner.token))
      .send({ weekly: everyDay(480, 1200), breaks: everyDay(720, 780) })
      .expect(204);
    // The clinic can't close while its doctor still works then.
    await request(server)
      .put(clinicHours)
      .set(as(owner.token))
      .send({ periods: everyDay(540, 1260) })
      .expect(409);
    const clinic = await request(server)
      .get(clinicHours)
      .set(as(owner.token))
      .expect(200);
    expect(clinic.body.periods).toHaveLength(7);
    expect(clinic.body.doctorPeriods).toHaveLength(7);
    const set = await request(server)
      .get(hoursPath)
      .set(as(owner.token))
      .expect(200);
    expect(set.body.clinics[0].weekly).toHaveLength(7);
    expect(set.body.clinics[0].breaks[0]).toEqual({
      weekday: 0,
      startsMinute: 720,
      endsMinute: 780,
    });
    // The next free time is worked out straight away.
    expect(set.body.nextAvailableAt).not.toBeNull();
    const thirty = slots((await options('initial')).body);
    expect(thirty.length).toBe(3 * 22);
    expect(thirty.every((s) => s.durationMinutes === 30)).toBe(true);

    // Own visit length, and no new patients.
    await request(server)
      .put(`/api/v1/platform/doctors/${doctorId}/booking`)
      .set(as(owner.token))
      .send({ visitMinutes: 20, bookable: true, acceptingNewPatients: false })
      .expect(204);
    expect(slots((await options('initial')).body)).toEqual([]);
    const twenty = slots((await options('followUp')).body);
    expect(twenty.length).toBe(3 * 33);
    expect(twenty.every((s) => s.durationMinutes === 20)).toBe(true);
    const book = (
      startsAt: string,
      type: 'initial' | 'followUp',
      minutes: number,
    ) =>
      request(server)
        .post('/api/v1/appointments')
        .set({ ...as(seeded.patient.token), 'idempotency-key': randomUUID() })
        .send({
          organizationId,
          clinicId,
          doctorId,
          patientProfileId: seeded.profile.id,
          type,
          reason: 'Check-up',
          startsAt,
          durationMinutes: minutes,
        });
    const first = (await options('followUp')).body.days[0].slots[0];
    await book(first.startsAt, 'initial', 20).expect(409);
    await book(first.startsAt, 'followUp', 30).expect(400);
    await book(first.startsAt, 'followUp', 20).expect(201);

    // Not bookable in the app at all.
    await request(server)
      .put(`/api/v1/platform/doctors/${doctorId}/booking`)
      .set(as(owner.token))
      .send({ visitMinutes: 20, bookable: false, acceptingNewPatients: true })
      .expect(204);
    expect(slots((await options('followUp')).body)).toEqual([]);
    const second = twenty[5] as unknown as { startsAt: string };
    await book(second.startsAt, 'followUp', 20).expect(409);
    const doctorCard = await request(server)
      .get(`/api/v1/doctors/${doctorId}`)
      .set(as(seeded.patient.token))
      .expect(200);
    expect(doctorCard.body.availability.status).toBe('unavailable');
    await request(server)
      .put(`/api/v1/platform/doctors/${doctorId}/booking`)
      .set(as(owner.token))
      .send({ visitMinutes: null, bookable: true, acceptingNewPatients: true })
      .expect(204);

    // Time off for the next three days, then removed.
    const leave = await request(server)
      .post(`/api/v1/platform/doctors/${doctorId}/leave`)
      .set(as(owner.token))
      .send({
        startsAt: new Date(`${day(1)}T00:00:00+03:00`).toISOString(),
        endsAt: new Date(`${day(4)}T00:00:00+03:00`).toISOString(),
      })
      .expect(201);
    expect(leave.body.bookedVisits).toBe(1);
    expect(slots((await options('initial')).body)).toEqual([]);
    await request(server)
      .post(`/api/v1/platform/doctors/${doctorId}/leave`)
      .set(as(owner.token))
      .send({
        startsAt: '2020-01-01T00:00:00.000Z',
        endsAt: '2020-01-02T00:00:00.000Z',
      })
      .expect(400);
    await request(server)
      .delete(`/api/v1/platform/doctors/${doctorId}/leave/${leave.body.ids[0]}`)
      .set(as(owner.token))
      .expect(204);
    expect(slots((await options('initial')).body).length).toBeGreaterThan(0);

    // "How far ahead patients can book".
    await request(server)
      .put('/api/v1/platform/app-settings')
      .set(as(owner.token))
      .send({ changes: { 'booking.daysAhead': 1 } })
      .expect(204);
    const near = await options('initial', day(0), day(5));
    const withSlots = near.body.days
      .filter((d: { slots: unknown[] }) => d.slots.length)
      .map((d: { date: string }) => d.date);
    expect(withSlots.every((d: string) => d <= day(1))).toBe(true);
    await request(server)
      .put('/api/v1/platform/app-settings')
      .set(as(owner.token))
      .send({ changes: { 'booking.daysAhead': 14 } })
      .expect(204);

    const audits = await apiPrisma.auditEvent.findMany({
      where: { actorUserId: owner.userId, targetId: doctorId },
      select: { action: true },
    });
    expect(audits.map((a) => a.action)).toEqual(
      expect.arrayContaining([
        'platform.doctor.hours.updated',
        'platform.doctor.booking.updated',
        'platform.doctor.leave.added',
        'platform.doctor.leave.removed',
      ]),
    );
    expect(
      await apiPrisma.auditEvent.count({
        where: {
          actorUserId: owner.userId,
          action: 'platform.clinic.hours.updated',
        },
      }),
    ).toBe(1);
    expect(
      (await request(server).get(hoursPath).set(as(owner.token)).expect(200))
        .body.clinics[0].openingHours,
    ).toHaveLength(7);
  });
});
