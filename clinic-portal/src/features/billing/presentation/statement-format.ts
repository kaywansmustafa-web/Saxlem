import type { Locale } from "@/i18n";

const intl = (locale: Locale) =>
  locale === "en" ? "en-GB" : locale === "ar" ? "ar-IQ" : "ckb-IQ";

/** Dates and money for statements: Baghdad time, Western digits. */
export function statementFormat(locale: Locale, iqdLabel: string) {
  const dayFormat = new Intl.DateTimeFormat(intl(locale), {
    timeZone: "Asia/Baghdad",
    day: "numeric",
    month: "short",
    year: "numeric",
    numberingSystem: "latn",
  });
  const dayTimeFormat = new Intl.DateTimeFormat(intl(locale), {
    timeZone: "Asia/Baghdad",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    numberingSystem: "latn",
  });
  const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
  return {
    day: (value: string) => dayFormat.format(new Date(value)),
    dayTime: (value: string) => dayTimeFormat.format(new Date(value)),
    /** A period ends at midnight; show the day before. */
    lastDay: (end: string) =>
      dayFormat.format(new Date(new Date(end).getTime() - 1)),
    iqd: (value: number) =>
      `${number.format(value === 0 ? 0 : value)} ${iqdLabel}`,
  };
}
