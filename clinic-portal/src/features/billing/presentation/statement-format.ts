import type { Locale } from "@/i18n";
import { formatter } from "@/lib/format";

/** Dates and money for statements: Baghdad time, Western digits, Badini month names. */
export function statementFormat(locale: Locale, iqdLabel: string) {
  const f = formatter(locale, "Asia/Baghdad");
  return {
    day: (value: string) => f.day(value),
    dayTime: (value: string) => f.dayTime(value),
    /** A period ends at midnight; show the day before. */
    lastDay: (end: string) => f.day(new Date(new Date(end).getTime() - 1)),
    iqd: (value: number) => `${f.number(value === 0 ? 0 : value)} ${iqdLabel}`,
  };
}
