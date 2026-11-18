import { ConflictException, ForbiddenException } from '@nestjs/common';
import type { PrismaService } from '../../../infrastructure/database/prisma.service';
import type { AppointmentRepository } from '../domain/appointment.repository';
import {
  EstimatedRouteTime,
  FallbackRouteTime,
  GoogleRouteTime,
  OsrmRouteTime,
  TomTomRouteTime,
  straightLineMeters,
  type RouteTime,
} from '../infrastructure/route-time';
import { DepartureService } from './departure.service';
import type { TripLearningService } from './trip-learning.service';

const patient = {
  actorId: 'u1',
  patient: true,
  doctor: false,
  platformAdministrator: false,
};
const home = { latitude: 36.85, longitude: 42.95 };
const clinic = { latitude: 36.8669, longitude: 42.9886 };
const now = new Date('2026-11-18T05:00:00.000Z'); // 08:00 in Duhok

function service(
  routes: (at: Date) => RouteTime,
  appointment: Record<string, unknown> = {},
  clinicPin: { latitude: number | null; longitude: number | null } = clinic,
  learned: { factor: number; trips: number } = { factor: 1, trips: 0 },
  arrival: { status: string } | null = null,
) {
  const drive = jest.fn((_a, _b, at: Date) => Promise.resolve(routes(at)));
  const factor = jest
    .fn<Promise<{ factor: number; trips: number }>, unknown[]>()
    .mockResolvedValue(learned);
  const upsert = jest
    .fn<Promise<object>, [{ create: object }]>()
    .mockResolvedValue({});
  return {
    drive,
    factor,
    upsert,
    departures: new DepartureService(
      {
        get: jest.fn().mockResolvedValue({
          id: 'a1',
          organizationId: 'o1',
          clinicId: 'c1',
          startsAt: '2026-11-18T07:00:00.000Z', // 10:00
          endsAt: '2026-11-18T07:20:00.000Z',
          type: 'initial',
          status: 'confirmed',
          ...appointment,
        }),
      } as unknown as AppointmentRepository,
      {
        db: {
          clinic: {
            findUnique: jest.fn().mockResolvedValue({
              ...clinicPin,
              city: 'Duhok',
              timezone: 'Asia/Baghdad',
            }),
          },
          appointmentArrival: {
            findUnique: jest.fn().mockResolvedValue(arrival),
          },
          appointmentTrip: { upsert },
        },
      } as unknown as PrismaService,
      { drive },
      { factor } as unknown as TripLearningService,
    ),
  };
}

describe('when to leave', () => {
  it('leaves time to drive, park and check in, using traffic expected at departure', async () => {
    const { departures, drive } = service((at) => ({
      // Heavier traffic later in the morning.
      seconds: at.getTime() > now.getTime() + 60 * 60_000 ? 20 * 60 : 12 * 60,
      meters: 8200,
      source: 'traffic',
    }));
    const plan = await departures.plan(patient, 'a1', home, now);
    // Arrive 10 min early for a first visit, 5 min to park, 20 min drive.
    expect(plan.arriveBy.toISOString()).toBe('2026-11-18T06:50:00.000Z');
    expect(plan.leaveAt.toISOString()).toBe('2026-11-18T06:25:00.000Z');
    expect(plan.travelSeconds).toBe(1200);
    expect(drive).toHaveBeenCalledTimes(2);
    expect(drive.mock.calls[1]![2].toISOString()).toBe(
      '2026-11-18T06:33:00.000Z',
    );
  });

  it('a follow-up needs less time at reception; no second call without traffic', async () => {
    const { departures, drive } = service(
      () => ({ seconds: 600, meters: 5000, source: 'roads' }),
      { type: 'followUp' },
    );
    const plan = await departures.plan(patient, 'a1', home, now);
    expect(plan.leaveAt.toISOString()).toBe('2026-11-18T06:40:00.000Z');
    expect(drive).toHaveBeenCalledTimes(1);
  });

  it('refuses staff, past visits and clinics without a map pin', async () => {
    const ok = () => ({ seconds: 1, meters: 1, source: 'estimate' as const });
    await expect(
      service(ok).departures.plan(
        { ...patient, patient: false },
        'a1',
        home,
        now,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service(ok, { status: 'completed' }).departures.plan(
        patient,
        'a1',
        home,
        now,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      service(ok, {}, { latitude: null, longitude: null }).departures.plan(
        patient,
        'a1',
        home,
        now,
      ),
    ).rejects.toThrow('map location');
  });

  it('corrects a road-only drive with what real Saxlem trips took', async () => {
    const roads = () => ({
      seconds: 600,
      meters: 5000,
      source: 'roads' as const,
    });
    const few = service(roads, {}, clinic, { factor: 1.5, trips: 2 });
    expect((await few.departures.plan(patient, 'a1', home, now)).source).toBe(
      'roads',
    );
    const { departures, factor } = service(roads, {}, clinic, {
      factor: 1.5,
      trips: 12,
    });
    const plan = await departures.plan(patient, 'a1', home, now);
    expect(plan.source).toBe('learned');
    expect(plan.travelSeconds).toBe(900);
    // 10:00 − 10 check-in − 5 park − 15 drive.
    expect(plan.leaveAt.toISOString()).toBe('2026-11-18T06:30:00.000Z');
    // Asked about the hour they would leave at.
    expect(factor.mock.calls[0]![0]).toEqual({
      id: 'c1',
      city: 'Duhok',
      timezone: 'Asia/Baghdad',
    });
    expect((factor.mock.calls[0]![3] as Date).toISOString()).toBe(
      '2026-11-18T06:35:00.000Z',
    );
  });

  it('"on my way" gives reception an arrival time and keeps only the drive time', async () => {
    const at = new Date('2026-11-18T06:30:00.000Z');
    const { departures, upsert } = service(
      () => ({ seconds: 840, meters: 8200, source: 'roads' }),
      {},
      clinic,
      { factor: 1.25, trips: 5 },
    );
    const trip = await departures.onTheWay(patient, 'a1', home, at);
    // 14 min × 1.25 = 17.5 min, plus 5 to park.
    expect(trip.arrivalEta.toISOString()).toBe('2026-11-18T06:52:30.000Z');
    expect(trip.source).toBe('learned');
    const stored = upsert.mock.calls[0]![0].create;
    expect(stored).toEqual({
      appointmentId: 'a1',
      organizationId: 'o1',
      clinicId: 'c1',
      startedAt: at,
      arrivalEta: trip.arrivalEta,
      routeSeconds: 840,
      distanceBand: 1,
      basis: 0,
    });
    expect(JSON.stringify(stored)).not.toContain('36.85');
  });

  it('"on my way" only on the day, before check-in', async () => {
    const ok = () => ({ seconds: 60, meters: 900, source: 'roads' as const });
    await expect(
      service(ok).departures.onTheWay(
        patient,
        'a1',
        home,
        new Date('2026-11-17T20:00:00.000Z'),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      service(ok, {}, clinic, undefined, {
        status: 'arrived',
      }).departures.onTheWay(patient, 'a1', home, now),
    ).rejects.toThrow('already arrived');
  });
});

describe('drive time providers', () => {
  it('estimates from distance when no routing service is set', async () => {
    const meters = straightLineMeters(home, clinic);
    expect(meters).toBeGreaterThan(3500);
    expect(meters).toBeLessThan(4500);
    const route = await new EstimatedRouteTime().drive(home, clinic);
    expect(route.source).toBe('estimate');
    expect(route.seconds).toBeGreaterThan(180);
  });

  it('asks Google for a traffic-aware route at the departure time', async () => {
    const http = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          routes: [{ duration: '754s', distanceMeters: 8210 }],
        }),
    });
    const departAt = new Date(Date.now() + 3_600_000);
    const route = await new GoogleRouteTime(
      'key-key-key-key-key-key',
      http,
    ).drive(home, clinic, departAt);
    expect(route).toEqual({ seconds: 754, meters: 8210, source: 'traffic' });
    const [url, init] = http.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('computeRoutes');
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body.routingPreference).toBe('TRAFFIC_AWARE');
    expect(body.departureTime).toBe(departAt.toISOString());
    expect((init.headers as Record<string, string>)['X-Goog-FieldMask']).toBe(
      'routes.duration,routes.distanceMeters',
    );
  });

  it('reads an OSRM route, and falls back to an estimate when a service fails', async () => {
    const http = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ routes: [{ duration: 512.4, distance: 6100.2 }] }),
    });
    expect(
      await new OsrmRouteTime(
        'https://osrm.local',
        http as unknown as typeof fetch,
      ).drive(home, clinic),
    ).toEqual({ seconds: 512, meters: 6100, source: 'roads' });
    const broken = { drive: jest.fn().mockRejectedValue(new Error('down')) };
    const route = await new FallbackRouteTime(broken).drive(home, clinic, now);
    expect(route.source).toBe('estimate');
  });

  it('reads a TomTom route, and labels it by whether TomTom saw traffic', async () => {
    const reply = (delay: number) =>
      jest.fn<Promise<unknown>, [string]>().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            routes: [
              {
                summary: {
                  travelTimeInSeconds: 903,
                  lengthInMeters: 8214,
                  trafficDelayInSeconds: delay,
                },
              },
            ],
          }),
      });
    const quiet = reply(0);
    const departAt = new Date(Date.now() + 3_600_000);
    expect(
      await new TomTomRouteTime(
        'tomtom-key-0123456789',
        quiet as unknown as typeof fetch,
      ).drive(home, clinic, departAt),
    ).toEqual({ seconds: 903, meters: 8214, source: 'roads' });
    const url = new URL(quiet.mock.calls[0]![0]);
    expect(url.pathname).toBe(
      '/routing/1/calculateRoute/36.85,42.95:36.8669,42.9886/json',
    );
    expect(url.searchParams.get('traffic')).toBe('true');
    expect(url.searchParams.get('departAt')).toBe(
      departAt.toISOString().replace(/\.\d{3}Z$/, 'Z'),
    );
    const busy = reply(120);
    expect(
      (
        await new TomTomRouteTime(
          'tomtom-key-0123456789',
          busy as unknown as typeof fetch,
        ).drive(home, clinic, new Date())
      ).source,
    ).toBe('traffic');
    expect(new URL(busy.mock.calls[0]![0]).searchParams.get('departAt')).toBe(
      'now',
    );
  });
});
