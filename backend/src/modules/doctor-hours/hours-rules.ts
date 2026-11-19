/** A weekly period in clinic-local minutes; weekday 0 = Sunday. */
export interface WeeklyPeriod {
  readonly weekday: number;
  readonly startsMinute: number;
  readonly endsMinute: number;
}

export const PERIODS_MAX = 28;
const DAY = 1440;

/**
 * Checks a week of working periods or breaks: whole 5-minute steps, inside
 * the day, starting before they end, and not overlapping on the same day.
 * Returns the periods sorted, or an error a person can act on.
 */
export function checkWeek(
  periods: readonly WeeklyPeriod[],
  what: 'hours' | 'breaks',
): { ok: true; periods: WeeklyPeriod[] } | { ok: false; error: string } {
  if (periods.length > PERIODS_MAX)
    return { ok: false, error: `Use at most ${PERIODS_MAX} ${what} a week.` };
  for (const p of periods) {
    if (
      !Number.isInteger(p.weekday) ||
      p.weekday < 0 ||
      p.weekday > 6 ||
      !Number.isInteger(p.startsMinute) ||
      !Number.isInteger(p.endsMinute) ||
      p.startsMinute < 0 ||
      p.endsMinute > DAY ||
      p.startsMinute % 5 !== 0 ||
      p.endsMinute % 5 !== 0
    )
      return { ok: false, error: 'Use times on the day, in 5-minute steps.' };
    if (p.startsMinute >= p.endsMinute)
      return { ok: false, error: 'Each period must end after it starts.' };
  }
  const sorted = [...periods].sort(
    (a, b) => a.weekday - b.weekday || a.startsMinute - b.startsMinute,
  );
  for (let i = 1; i < sorted.length; i++) {
    const a = sorted[i - 1]!;
    const b = sorted[i]!;
    if (a.weekday === b.weekday && b.startsMinute < a.endsMinute)
      return {
        ok: false,
        error:
          what === 'hours'
            ? 'Working periods on the same day overlap.'
            : 'Breaks on the same day overlap.',
      };
  }
  return { ok: true, periods: sorted };
}

/** Breaks that don't fall inside any working period (worth a warning). */
export function strayBreaks(
  hours: readonly WeeklyPeriod[],
  breaks: readonly WeeklyPeriod[],
): WeeklyPeriod[] {
  return breaks.filter(
    (b) =>
      !hours.some(
        (h) =>
          h.weekday === b.weekday &&
          h.startsMinute <= b.startsMinute &&
          h.endsMinute >= b.endsMinute,
      ),
  );
}
