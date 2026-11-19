import {
  clinicHour,
  distanceBand,
  FACTOR_RANGE,
  learnedFactor,
  observedRatio,
} from './trip-learning';

describe('learning drive times from real visits', () => {
  it('buckets by the hour at the clinic, with Friday and Saturday as the weekend', () => {
    // Thursday 07:30 UTC = 10:30 in Duhok.
    expect(
      clinicHour(new Date('2026-11-19T07:30:00Z'), 'Asia/Baghdad'),
    ).toEqual({ dayKind: 0, hour: 10 });
    // Thursday 22:30 UTC = Friday 01:30 in Duhok.
    expect(
      clinicHour(new Date('2026-11-19T22:30:00Z'), 'Asia/Baghdad'),
    ).toEqual({ dayKind: 1, hour: 1 });
    expect(distanceBand(4_999)).toBe(0);
    expect(distanceBand(12_000)).toBe(1);
    expect(distanceBand(60_000)).toBe(2);
  });

  it('counts a trip only when it is believable', () => {
    const start = new Date('2026-11-19T06:00:00Z');
    const at = (minutes: number) =>
      new Date(start.getTime() + minutes * 60_000);
    // 25 min to reception − 5 to park = 20 min of driving vs 16 routed.
    expect(observedRatio(start, at(25), 16 * 60)).toBeCloseTo(1.25);
    // Stopped for an hour on the way, or tapped after arriving.
    expect(observedRatio(start, at(120), 16 * 60)).toBeNull();
    expect(observedRatio(start, at(6), 16 * 60)).toBeNull();
  });

  it('needs several trips before it moves, and never goes wild', () => {
    expect(learnedFactor([])).toEqual({ factor: 1, trips: 0 });
    const one = { trips: 1, sumLogRatio: Math.log(2) };
    const oneTrip = learnedFactor([one, one, one]);
    // One slow trip nudges, it doesn't double.
    expect(oneTrip.factor).toBeGreaterThan(1);
    expect(oneTrip.factor).toBeLessThan(1.3);
    const many = { trips: 40, sumLogRatio: 40 * Math.log(1.4) };
    expect(learnedFactor([many, many, many]).factor).toBeCloseTo(1.37, 1);
    const extreme = { trips: 500, sumLogRatio: 500 * Math.log(5) };
    expect(learnedFactor([extreme]).factor).toBe(FACTOR_RANGE.max);
  });

  it('lets a clinic with its own trips differ from the rest of the city', () => {
    const city = { trips: 60, sumLogRatio: 60 * Math.log(1.2) };
    const clinic = { trips: 20, sumLogRatio: 20 * Math.log(1.6) };
    const factor = learnedFactor([city, city, clinic]).factor;
    expect(factor).toBeGreaterThan(1.45);
    expect(factor).toBeLessThan(1.6);
  });
});
