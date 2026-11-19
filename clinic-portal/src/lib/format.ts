import type { Locale } from "@/i18n";

/** Every clinic is in Iraq; the backend still returns each clinic's own zone. */
export const CLINIC_TIME_ZONE = "Asia/Baghdad";

const tag = (locale: Locale) =>
  locale === "en" ? "en-GB" : locale === "ar" ? "ar-IQ" : "ckb-IQ";

/** Badini names: Node ships no Kurdish calendar data, so server and browser would disagree. */
const badiniMonths = [
  "کانوونا دووێ", "شوبات", "ئادار", "نیسان", "گولان", "حزیران",
  "تیرمەه", "تەباخ", "ئیلوون", "چریا ئێکێ", "چریا دووێ", "کانوونا ئێکێ",
];
const badiniWeekdays = ["یەکشەمب", "دووشەمب", "سێشەمب", "چارشەمب", "پێنجشەمب", "ئەینی", "شەمبی"];

function parts(value: Date, timeZone: string) {
  const [year, month, day, weekday] = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  })
    .formatToParts(value)
    .reduce<string[]>((acc, part) => {
      if (part.type === "year") acc[0] = part.value;
      if (part.type === "month") acc[1] = part.value;
      if (part.type === "day") acc[2] = part.value;
      if (part.type === "weekday") acc[3] = part.value;
      return acc;
    }, []);
  return {
    year,
    month: Number(month) - 1,
    day: Number(day),
    weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday),
  };
}

/**
 * One way to write dates, times and money across the portal: "17 Nov 2026",
 * 24-hour times, Western digits, always in the clinic's time zone.
 */
export function formatter(locale: Locale, timeZone = CLINIC_TIME_ZONE) {
  const base = { timeZone, numberingSystem: "latn" } as const;
  const day = new Intl.DateTimeFormat(tag(locale), {
    ...base,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const dayNoYear = new Intl.DateTimeFormat(tag(locale), {
    ...base,
    day: "numeric",
    month: "short",
  });
  const weekdayDay = new Intl.DateTimeFormat(tag(locale), {
    ...base,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const weekdayShort = new Intl.DateTimeFormat(tag(locale), {
    ...base,
    weekday: "short",
  });
  const time = new Intl.DateTimeFormat(tag(locale), {
    ...base,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
  const toDate = (value: string | Date) =>
    value instanceof Date ? value : new Date(value);
  const ku = locale === "ku";
  const kuDay = (value: Date, withYear: boolean) => {
    const p = parts(value, timeZone);
    return `${p.day} ${badiniMonths[p.month]}${withYear ? ` ${p.year}` : ""}`;
  };
  return {
    day: (value: string | Date) => (ku ? kuDay(toDate(value), true) : day.format(toDate(value))),
    dayNoYear: (value: string | Date) => (ku ? kuDay(toDate(value), false) : dayNoYear.format(toDate(value))),
    weekdayDay: (value: string | Date) =>
      ku
        ? `${badiniWeekdays[parts(toDate(value), timeZone).weekday]}، ${kuDay(toDate(value), false)}`
        : weekdayDay.format(toDate(value)),
    weekdayShort: (value: string | Date) =>
      ku ? badiniWeekdays[parts(toDate(value), timeZone).weekday] : weekdayShort.format(toDate(value)),
    /** ", " in English, "، " in Arabic script. */
    comma: locale === "en" ? ", " : "، ",
    time: (value: string | Date) => time.format(toDate(value)),
    dayTime: (value: string | Date) =>
      `${ku ? kuDay(toDate(value), true) : day.format(toDate(value))}${locale === "en" ? ", " : "، "}${time.format(toDate(value))}`,
    number: (value: number) => number.format(value),
    iqd: (value: number) => `${number.format(value)} IQD`,
    /** Whole minutes between two instants, never negative. */
    minutesBetween: (from: string | Date, to: string | Date = new Date()) =>
      Math.max(
        0,
        Math.round((toDate(to).getTime() - toDate(from).getTime()) / 60_000),
      ),
  };
}

/** The calendar day (YYYY-MM-DD) an instant falls on in the clinic. */
export function clinicDay(at: Date = new Date(), timeZone = CLINIC_TIME_ZONE) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

/** UTC instants bounding a clinic calendar day (Iraq has no daylight saving). */
export function clinicDayBounds(date: string, offsetHours = 3) {
  const start = new Date(`${date}T00:00:00.000Z`);
  start.setUTCHours(start.getUTCHours() - offsetHours);
  const end = new Date(start.getTime() + 24 * 3_600_000);
  return { from: start.toISOString(), to: end.toISOString() };
}
