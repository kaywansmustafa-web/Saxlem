import { Injectable, Logger } from '@nestjs/common';

export interface LatLng {
  readonly latitude: number;
  readonly longitude: number;
}

/** How long the drive takes, and how sure we are. */
export interface RouteTime {
  readonly seconds: number;
  readonly meters: number;
  /** traffic: Google with live/predicted traffic; roads: road network, no
   * traffic; estimate: straight-line distance only. */
  readonly source: 'traffic' | 'roads' | 'estimate';
}

export interface RouteTimeProvider {
  /** Drive time from origin to destination, setting off at [departAt]. */
  drive(
    origin: LatLng,
    destination: LatLng,
    departAt: Date,
  ): Promise<RouteTime>;
}

const EARTH_METERS = 6_371_000;

/** Great-circle distance in meters. */
export function straightLineMeters(a: LatLng, b: LatLng): number {
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad,
    dLng = (b.longitude - a.longitude) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * rad) *
      Math.cos(b.latitude * rad) *
      Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Without a routing service: roads are about 1.35× the straight line, and
 * city driving averages about 25 km/h, plus 3 minutes to get going.
 */
export class EstimatedRouteTime implements RouteTimeProvider {
  drive(origin: LatLng, destination: LatLng): Promise<RouteTime> {
    const meters = Math.round(straightLineMeters(origin, destination) * 1.35);
    return Promise.resolve({
      meters,
      seconds: Math.round(meters / (25_000 / 3600)) + 180,
      source: 'estimate',
    });
  }
}

/** A self-hosted OSRM server (OpenStreetMap roads, no traffic). */
export class OsrmRouteTime implements RouteTimeProvider {
  constructor(
    private readonly baseUrl: string,
    private readonly http: typeof fetch = fetch,
  ) {}

  async drive(origin: LatLng, destination: LatLng): Promise<RouteTime> {
    const path = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
    const response = await this.http(
      `${this.baseUrl}/route/v1/driving/${path}?overview=false`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!response.ok) throw new Error('ROUTE_UNAVAILABLE');
    const body = (await response.json()) as {
      routes?: { duration?: number; distance?: number }[];
    };
    const route = body.routes?.[0];
    if (
      !route ||
      !Number.isFinite(route.duration) ||
      !Number.isFinite(route.distance)
    )
      throw new Error('ROUTE_UNAVAILABLE');
    return {
      seconds: Math.round(route.duration!),
      meters: Math.round(route.distance!),
      source: 'roads',
    };
  }
}

/**
 * Google Routes API with traffic: live traffic for "now", Google's traffic
 * prediction for a later departure. Billed as Compute Routes Pro.
 */
export class GoogleRouteTime implements RouteTimeProvider {
  constructor(
    private readonly apiKey: string,
    private readonly http: typeof fetch = fetch,
  ) {}

  async drive(
    origin: LatLng,
    destination: LatLng,
    departAt: Date,
  ): Promise<RouteTime> {
    const point = (value: LatLng) => ({
      location: {
        latLng: { latitude: value.latitude, longitude: value.longitude },
      },
    });
    // Google refuses departure times in the past; "now" means live traffic.
    const departure = new Date(
      Math.max(departAt.getTime(), Date.now() + 60_000),
    );
    const response = await this.http(
      'https://routes.googleapis.com/directions/v2:computeRoutes',
      {
        method: 'POST',
        signal: AbortSignal.timeout(8000),
        headers: {
          'content-type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters',
        },
        body: JSON.stringify({
          origin: point(origin),
          destination: point(destination),
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_AWARE',
          departureTime: departure.toISOString(),
        }),
      },
    );
    if (!response.ok) throw new Error('ROUTE_UNAVAILABLE');
    const body = (await response.json()) as {
      routes?: { duration?: string; distanceMeters?: number }[];
    };
    const route = body.routes?.[0];
    const seconds = Number(/^(\d+)s$/.exec(route?.duration ?? '')?.[1]);
    if (!route || !Number.isFinite(seconds))
      throw new Error('ROUTE_UNAVAILABLE');
    return {
      seconds,
      meters: route.distanceMeters ?? 0,
      source: 'traffic',
    };
  }
}

/** Tries the configured service and falls back to an estimate, so a
 * patient always gets an answer (labelled by its source). */
@Injectable()
export class FallbackRouteTime implements RouteTimeProvider {
  private readonly logger = new Logger('RouteTime');
  private readonly estimate = new EstimatedRouteTime();
  constructor(private readonly primary: RouteTimeProvider | null) {}

  async drive(origin: LatLng, destination: LatLng, departAt: Date) {
    if (this.primary)
      try {
        return await this.primary.drive(origin, destination, departAt);
      } catch {
        // Never log the location; only that the service failed.
        this.logger.warn({ outcomeCode: 'ROUTE_PROVIDER_FAILED' });
      }
    return this.estimate.drive(origin, destination);
  }
}
