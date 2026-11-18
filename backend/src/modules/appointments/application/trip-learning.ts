/**
 * Pure rules for learning real drive times from Saxlem's own visits.
 *
 * A patient taps "I'm on my way"; reception later records their arrival.
 * (arrival − start − park-and-walk) ÷ routed drive time is one observation.
 * Observations are kept only as running totals of log ratios per clinic,
 * distance band, workday/weekend and hour, and blended upwards (clinic →
 * city → city at that hour → no change) so a few trips never swing a time.
 */

export const PARK_AND_WALK_SECONDS = 5 * 60;
/** Trips needed (city-wide, at that hour) before a learned time is shown. */
export const MIN_TRIPS = 3;
/** How strongly each level leans on the one above it (in trips). */
export const SHRINK = 4;
/** A learned factor never shortens a drive below this or stretches past that. */
export const FACTOR_RANGE = { min: 0.8, max: 2.5 } as const;
/** Observations outside this are noise (stopped on the way, wrong tap). */
export const RATIO_RANGE = { min: 0.5, max: 3 } as const;

export type TripBasis = 'roads' | 'estimate' | 'traffic';
export const BASIS_CODE: Record<TripBasis, number> = {
  roads: 0,
  estimate: 1,
  traffic: 2,
};

/** 0: under 5 km, 1: 5–20 km, 2: over 20 km (between towns). */
export function distanceBand(meters: number): 0 | 1 | 2 {
  return meters < 5_000 ? 0 : meters < 20_000 ? 1 : 2;
}

/** Workday (Sun–Thu) or weekend (Fri–Sat), and the hour, at the clinic. */
export function clinicHour(
  at: Date,
  timeZone: string,
): { dayKind: 0 | 1; hour: number } {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      hour: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(at);
  } catch {
    return clinicHour(at, 'Asia/Baghdad');
  }
  const weekday = parts.find((part) => part.type === 'weekday')?.value;
  const hour = Number(parts.find((part) => part.type === 'hour')?.value);
  return {
    dayKind: weekday === 'Fri' || weekday === 'Sat' ? 1 : 0,
    hour: Number.isInteger(hour) ? hour % 24 : 0,
  };
}

/** One trip's real ÷ routed drive, or null when it can't be trusted. */
export function observedRatio(
  startedAt: Date,
  arrivedAt: Date,
  routeSeconds: number,
): number | null {
  const drove =
    (arrivedAt.getTime() - startedAt.getTime()) / 1000 - PARK_AND_WALK_SECONDS;
  if (routeSeconds < 60 || drove < 60) return null;
  const ratio = drove / routeSeconds;
  return ratio >= RATIO_RANGE.min && ratio <= RATIO_RANGE.max ? ratio : null;
}

export interface Totals {
  readonly trips: number;
  readonly sumLogRatio: number;
}

/**
 * Blends the levels, broadest first (city at this hour, then city at this
 * hour and distance, then this clinic at this hour and distance). The
 * broadest level is pulled towards "no change" until it has many trips;
 * each narrower level only adds how far its own trips differ from the level
 * above, pulled in the same way. Trips counted at several levels therefore
 * count once.
 */
export function learnedFactor(levels: readonly Totals[]): {
  factor: number;
  trips: number;
} {
  let estimate = 0;
  let parentMean: number | null = null;
  for (const level of levels) {
    if (level.trips <= 0) break;
    const mean = level.sumLogRatio / level.trips;
    const weight = level.trips / (level.trips + SHRINK);
    estimate =
      parentMean === null
        ? weight * mean
        : estimate + weight * (mean - parentMean);
    parentMean = mean;
  }
  const factor = Math.min(
    FACTOR_RANGE.max,
    Math.max(FACTOR_RANGE.min, Math.exp(estimate)),
  );
  return { factor, trips: levels[0]?.trips ?? 0 };
}
