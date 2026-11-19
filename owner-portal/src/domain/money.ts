import { when } from "./format";

export const iqd = (value: number) =>
  `${(value === 0 ? 0 : value).toLocaleString("en-IQ")} IQD`;

export const baghdadDateTime = (value: string | null) =>
  value ? when(value) : "—";

/** Current Baghdad month as YYYY-MM. */
export function currentMonth(now = new Date()) {
  const baghdad = new Date(now.getTime() + 3 * 3_600_000);
  return `${baghdad.getUTCFullYear()}-${String(baghdad.getUTCMonth() + 1).padStart(2, "0")}`;
}
