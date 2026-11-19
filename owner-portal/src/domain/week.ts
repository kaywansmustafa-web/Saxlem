/** Weekly hours: weekday 0 = Sunday; minutes after midnight, clinic time. */
export type Period = { weekday: number; startsMinute: number; endsMinute: number };

/** Kurdistan's week starts on Saturday. */
export const weekOrder = [6, 0, 1, 2, 3, 4, 5] as const;
export const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export const toTime = (minutes: number) =>
  minutes >= 1440
    ? "24:00"
    : `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** "HH:MM" → minutes; "00:00" as an end means midnight (1440). */
export function fromTime(value: string, end = false): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const minutes = Number(match[1]) * 60 + Number(match[2]);
  if (minutes > 1440) return null;
  return end && minutes === 0 ? 1440 : minutes;
}

/** The same rules as the server (hours-rules.ts), with words for the owner. */
export function weekProblem(periods: readonly Period[], what: "hours" | "breaks"): string | null {
  if (periods.length > 28) return `Use at most 28 ${what} a week.`;
  for (const p of periods) {
    if (p.startsMinute % 5 || p.endsMinute % 5) return "Use times in 5-minute steps (09:00, 09:05…).";
    if (p.startsMinute >= p.endsMinute)
      return `${weekdayNames[p.weekday]}: each period must end after it starts.`;
  }
  const sorted = [...periods].sort((a, b) => a.weekday - b.weekday || a.startsMinute - b.startsMinute);
  for (let i = 1; i < sorted.length; i++)
    if (sorted[i]!.weekday === sorted[i - 1]!.weekday && sorted[i]!.startsMinute < sorted[i - 1]!.endsMinute)
      return `${weekdayNames[sorted[i]!.weekday]}: ${what === "hours" ? "periods" : "breaks"} overlap.`;
  return null;
}

/** Periods in [inner] that don't sit inside one of [outer] on the same day. */
export const outside = (outer: readonly Period[], inner: readonly Period[]) =>
  inner.filter(
    (p) => !outer.some((o) => o.weekday === p.weekday && o.startsMinute <= p.startsMinute && o.endsMinute >= p.endsMinute),
  );

/** "Sat 09:00–13:00, 16:00–20:00 · Sun …" */
export function summary(periods: readonly Period[]): string {
  const parts = weekOrder
    .map((day) => {
      const own = periods.filter((p) => p.weekday === day).sort((a, b) => a.startsMinute - b.startsMinute);
      return own.length
        ? `${weekdayNames[day].slice(0, 3)} ${own.map((p) => `${toTime(p.startsMinute)}–${toTime(p.endsMinute)}`).join(", ")}`
        : null;
    })
    .filter(Boolean);
  return parts.length ? parts.join(" · ") : "None";
}

/** "+03:00" for a time zone at a moment (Kurdistan has no summer time). */
export function offsetOf(timeZone: string, at: Date): string {
  try {
    const part = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
      .formatToParts(at)
      .find((p) => p.type === "timeZoneName")?.value;
    const match = /GMT([+-]\d{2}:\d{2})/.exec(part ?? "");
    return match ? match[1]! : "+00:00";
  } catch {
    return "+03:00";
  }
}

/** A clinic-local "2026-11-20T09:00" as an exact moment. */
export const localToIso = (local: string, timeZone: string) =>
  `${local}:00${offsetOf(timeZone, new Date(`${local}:00Z`))}`;

/** An exact moment shown in clinic time: "Thu 20 Nov 2026, 09:00". */
export const clinicTime = (iso: string, timeZone: string) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
