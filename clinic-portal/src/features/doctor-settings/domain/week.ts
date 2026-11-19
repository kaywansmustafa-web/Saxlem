/** Weekly hours: weekday 0 = Sunday; minutes after midnight, clinic time. */
export type Period = { weekday: number; startsMinute: number; endsMinute: number };

/** Kurdistan's week starts on Saturday. */
export const weekOrder = [6, 0, 1, 2, 3, 4, 5] as const;
export const PERIODS_MAX = 28;
export const DOCTOR_LANGUAGES = ["badiniKurdish", "soraniKurdish", "arabic", "english", "turkish"] as const;
export type DoctorLanguage = (typeof DOCTOR_LANGUAGES)[number];
export const FEE_MAX = 5_000_000;
export const BIOGRAPHY_MAX = 4000;

export const toTime = (minutes: number) =>
  minutes >= 1440
    ? "24:00"
    : `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** The value of an <input type="time">: midnight at the end of a day is "00:00". */
export const inputTime = (minutes: number) => (minutes >= 1440 ? "00:00" : toTime(minutes));

/** "HH:MM" → minutes; "00:00" as an end means midnight (1440). */
export function fromTime(value: string, end = false): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const minutes = Number(match[1]) * 60 + Number(match[2]);
  if (Number(match[2]) > 59 || minutes > 1440) return null;
  return end && minutes === 0 ? 1440 : minutes;
}

export type WeekProblem =
  | { kind: "tooMany" }
  | { kind: "steps" }
  | { kind: "order"; weekday: number }
  | { kind: "overlap"; weekday: number };

/** The same rules as the server (backend hours-rules.ts). */
export function weekProblem(periods: readonly Period[]): WeekProblem | null {
  if (periods.length > PERIODS_MAX) return { kind: "tooMany" };
  for (const p of periods) {
    if (p.startsMinute % 5 || p.endsMinute % 5) return { kind: "steps" };
    if (p.startsMinute >= p.endsMinute) return { kind: "order", weekday: p.weekday };
  }
  const sorted = [...periods].sort((a, b) => a.weekday - b.weekday || a.startsMinute - b.startsMinute);
  for (let i = 1; i < sorted.length; i++)
    if (sorted[i]!.weekday === sorted[i - 1]!.weekday && sorted[i]!.startsMinute < sorted[i - 1]!.endsMinute)
      return { kind: "overlap", weekday: sorted[i]!.weekday };
  return null;
}

/** Periods in [inner] that don't sit inside one of [outer] on the same day. */
export const outside = (outer: readonly Period[], inner: readonly Period[]) =>
  inner.filter(
    (p) => !outer.some((o) => o.weekday === p.weekday && o.startsMinute <= p.startsMinute && o.endsMinute >= p.endsMinute),
  );

/** Whether any of [a] overlaps any of [b] on the same day. */
export const overlapsAny = (a: readonly Period[], b: readonly Period[]) =>
  a.some((p) => b.some((o) => o.weekday === p.weekday && o.startsMinute < p.endsMinute && o.endsMinute > p.startsMinute));

/** A new period for a day: after the last one, or the given default. */
export function nextPeriod(day: number, existing: readonly Period[], fallback: readonly [number, number]): Period {
  const last = existing
    .filter((p) => p.weekday === day)
    .sort((a, b) => a.startsMinute - b.startsMinute)
    .at(-1);
  if (!last) return { weekday: day, startsMinute: fallback[0], endsMinute: fallback[1] };
  const start = Math.min(last.endsMinute + 60, 1380);
  return { weekday: day, startsMinute: start, endsMinute: Math.min(start + 180, 1440) };
}

/** Every day gets the given day's periods. */
export const copyToEveryDay = (periods: readonly Period[], day: number): Period[] => {
  const own = periods.filter((p) => p.weekday === day);
  return weekOrder.flatMap((other) => own.map((p) => ({ ...p, weekday: other })));
};

/** "+03:00" for a time zone at a moment (Kurdistan has no summer time). */
export function offsetOf(timeZone: string, at: Date): string {
  try {
    const part = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
      .formatToParts(at)
      .find((p) => p.type === "timeZoneName")?.value;
    if (part === "GMT") return "+00:00";
    const match = /GMT([+-]\d{2}:\d{2})/.exec(part ?? "");
    return match ? match[1]! : "+03:00";
  } catch {
    return "+03:00";
  }
}

/** A clinic-local "2026-11-20T09:00" as an exact moment. */
export const localToIso = (local: string, timeZone: string) =>
  new Date(`${local}:00${offsetOf(timeZone, new Date(`${local}:00Z`))}`).toISOString();

const isDay = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
const nextDay = (day: string) => new Date(Date.parse(`${day}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);

/** Whole days off, first and last day included. Null when the days don't make sense. */
export function wholeDays(firstDay: string, lastDay: string, timeZone: string) {
  if (!isDay(firstDay) || !isDay(lastDay) || lastDay < firstDay) return null;
  return { startsAt: localToIso(`${firstDay}T00:00`, timeZone), endsAt: localToIso(`${nextDay(lastDay)}T00:00`, timeZone) };
}

/** Part of one day off. Null when the times don't make sense. */
export function partOfDay(day: string, from: string, until: string, timeZone: string) {
  const start = fromTime(from),
    end = fromTime(until, true);
  if (!isDay(day) || start === null || end === null || end <= start) return null;
  return {
    startsAt: localToIso(`${day}T${toTime(start)}`, timeZone),
    endsAt: end >= 1440 ? localToIso(`${nextDay(day)}T00:00`, timeZone) : localToIso(`${day}T${toTime(end)}`, timeZone),
  };
}
