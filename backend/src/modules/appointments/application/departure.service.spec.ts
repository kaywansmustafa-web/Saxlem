import { ConflictException, ForbiddenException } from '@nestjs/common';
import type { PrismaService } from '../../../infrastructure/database/prisma.service';
import type { AppointmentRepository } from '../domain/appointment.repository';
import {
  EstimatedRouteTime,
  FallbackRouteTime,
  GoogleRouteTime,
  OsrmRouteTime,
  straightLineMeters,
  type RouteTime,
} from '../infrastructure/route-time';
import { DepartureService } from './departure.service';

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
) {
  const drive = jest.fn((_a, _b, at: Date) => Promise.resolve(routes(at)));
  return {
    drive,
    departures: new DepartureService(
      {
        get: jest.fn().mockResolvedValue({
          clinicId: 'c1',
          startsAt: '2026-11-18T07:00:00.000Z', // 10:00
          type: 'initial',
          status: 'confirmed',
          ...appointment,
        }),
      } as unknown as AppointmentRepository,
      {
        db: { clinic: { findUnique: jest.fn().mockResolvedValue(clinicPin) } },
      } as unknown as PrismaService,
      { drive },
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
});
