/**
 * Billing runs in 30-day cycles counted from the day an organization's first
 * clinic was listed in the app. Days are Asia/Baghdad days (UTC+03:00, no
 * daylight saving), so a cycle starts at 00:00 Baghdad time.
 */
export const BILLING_CYCLE_DAYS = 30;
const DAY_MS = 86_400_000;
const CYCLE_MS = BILLING_CYCLE_DAYS * DAY_MS;
const BAGHDAD_OFFSET_MS = 3 * 3_600_000;

export interface BillingCycle {
  /** 1 for the first 30 days, then 2, 3, ... */
  readonly number: number;
  readonly start: Date;
  readonly end: Date;
}

/** Midnight in Baghdad on a YYYY-MM-DD day. */
export function baghdadMidnight(day: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) throw new Error('Day must look like 2026-11-17.');
  const value = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) -
      BAGHDAD_OFFSET_MS,
  );
  if (Number.isNaN(value.getTime())) throw new Error('Day is invalid.');
  return value;
}

/** The Baghdad calendar day of an instant, as YYYY-MM-DD. */
export function baghdadDay(at: Date): string {
  return new Date(at.getTime() + BAGHDAD_OFFSET_MS).toISOString().slice(0, 10);
}

/** A database DATE (midnight UTC) as the YYYY-MM-DD it stands for. */
export function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function cycleByNumber(anchorDay: string, number: number): BillingCycle {
  if (!Number.isInteger(number) || number < 1)
    throw new Error('Cycle number must be 1 or more.');
  const anchor = baghdadMidnight(anchorDay).getTime();
  return Object.freeze({
    number,
    start: new Date(anchor + (number - 1) * CYCLE_MS),
    end: new Date(anchor + number * CYCLE_MS),
  });
}

/** The cycle an instant falls in; anything before the first day counts in
 * cycle 1. */
export function cycleAt(anchorDay: string, at: Date): BillingCycle {
  const elapsed = at.getTime() - baghdadMidnight(anchorDay).getTime();
  return cycleByNumber(
    anchorDay,
    Math.max(1, Math.floor(elapsed / CYCLE_MS) + 1),
  );
}

/** Where cycle data starts: cycle 1 also takes anything before the first
 * day, so moving the start date never strands a charge or payment. */
export function cycleQueryStart(cycle: BillingCycle): Date {
  return cycle.number === 1 ? new Date(0) : cycle.start;
}

/** A readable, stable statement number, e.g. SX-79C55D-007. */
export function statementNumber(doctorId: string, cycleNumber: number): string {
  return `SX-${doctorId.replace(/-/g, '').slice(-6).toUpperCase()}-${String(cycleNumber).padStart(3, '0')}`;
}
