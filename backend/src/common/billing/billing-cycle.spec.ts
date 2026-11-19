import {
  baghdadDay,
  baghdadMidnight,
  cycleAt,
  cycleByNumber,
  cycleQueryStart,
  statementNumber,
} from './billing-cycle';

describe('30-day billing cycles', () => {
  it('starts each cycle at Baghdad midnight, 30 days apart', () => {
    expect(baghdadMidnight('2026-11-17').toISOString()).toBe(
      '2026-11-16T21:00:00.000Z',
    );
    const first = cycleByNumber('2026-11-17', 1);
    expect(first.end.toISOString()).toBe('2026-12-16T21:00:00.000Z');
    const third = cycleByNumber('2026-11-17', 3);
    expect(baghdadDay(third.start)).toBe('2027-01-16');
  });

  it('finds the cycle an instant falls in', () => {
    expect(cycleAt('2026-11-17', new Date('2026-11-16T21:00:00Z')).number).toBe(
      1,
    );
    expect(cycleAt('2026-11-17', new Date('2026-12-16T20:59:59Z')).number).toBe(
      1,
    );
    expect(cycleAt('2026-11-17', new Date('2026-12-16T21:00:00Z')).number).toBe(
      2,
    );
    expect(cycleAt('2026-11-17', new Date('2026-01-01T00:00:00Z')).number).toBe(
      1,
    );
  });

  it('lets cycle 1 take anything before the first day', () => {
    expect(cycleQueryStart(cycleByNumber('2026-11-17', 1)).getTime()).toBe(0);
    expect(cycleQueryStart(cycleByNumber('2026-11-17', 2)).toISOString()).toBe(
      '2026-12-16T21:00:00.000Z',
    );
  });

  it('numbers statements per doctor and cycle', () => {
    expect(statementNumber('01a1e690-ab6a-7685-9945-0d27fe79c55d', 7)).toBe(
      'SX-79C55D-007',
    );
  });
});
