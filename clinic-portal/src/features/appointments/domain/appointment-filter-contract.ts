import { z } from "zod";
export const IRAQ_UTC_OFFSET = "+03:00",
  MAX_APPOINTMENT_CURSOR_LENGTH = 1024,
  MAX_APPOINTMENT_CURSOR_TRAIL = 10;
export const opaqueAppointmentCursorSchema = z
  .string()
  .min(1)
  .max(MAX_APPOINTMENT_CURSOR_LENGTH)
  .regex(/^[\x21-\x7e]+$/u);
export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/u.test(value))
    return false;
  const [y, m, d] = value.split("-").map(Number),
    date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}
export function iraqCalendarDate(now = new Date()): string {
  return new Date(now.getTime() + 3 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}
export function iraqDateRange(
  rawFrom: unknown,
  rawTo: unknown,
  now = new Date(),
):
  | {
      ok: true;
      from: string;
      to: string;
      fromInstant: string;
      toInstant: string;
    }
  | { ok: false; from: string; to: string } {
  const today = iraqCalendarDate(now),
    from = rawFrom === undefined ? today : String(rawFrom),
    to = rawTo === undefined ? today : String(rawTo);
  if (!isCalendarDate(from) || !isCalendarDate(to) || from > to)
    return {
      ok: false,
      from: isCalendarDate(from) ? from : today,
      to: isCalendarDate(to) ? to : today,
    };
  return {
    ok: true,
    from,
    to,
    fromInstant: `${from}T00:00:00.000${IRAQ_UTC_OFFSET}`,
    toInstant: `${to}T23:59:59.999${IRAQ_UTC_OFFSET}`,
  };
}
export function iraqLocalDateTimeToOffset(value: string): string | null {
  const match = /^(\d{4}-\d{2}-\d{2})T([01]\d|2[0-3]):([0-5]\d)$/u.exec(value);
  return match && isCalendarDate(match[1])
    ? `${match[1]}T${match[2]}:${match[3]}:00${IRAQ_UTC_OFFSET}`
    : null;
}
export function parseAppointmentNavigation(
  cursorValue: unknown,
  trailValue: unknown,
):
  | { ok: true; cursor?: string; trail: readonly string[] }
  | { ok: false; trail: readonly [] } {
  const cursor =
    cursorValue === undefined
      ? undefined
      : opaqueAppointmentCursorSchema.safeParse(cursorValue);
  if (cursorValue !== undefined && !cursor?.success)
    return { ok: false, trail: [] };
  if (trailValue === undefined)
    return {
      ok: true,
      ...(cursor?.success ? { cursor: cursor.data } : {}),
      trail: [],
    };
  if (typeof trailValue !== "string" || trailValue.length > 8192)
    return { ok: false, trail: [] };
  try {
    const decoded: unknown = JSON.parse(trailValue);
    if (
      !Array.isArray(decoded) ||
      decoded.length > MAX_APPOINTMENT_CURSOR_TRAIL
    )
      return { ok: false, trail: [] };
    const parsed = z.array(opaqueAppointmentCursorSchema).safeParse(decoded);
    return parsed.success
      ? {
          ok: true,
          ...(cursor?.success ? { cursor: cursor.data } : {}),
          trail: Object.freeze(parsed.data),
        }
      : { ok: false, trail: [] };
  } catch {
    return { ok: false, trail: [] };
  }
}
