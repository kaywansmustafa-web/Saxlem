/** One way to write dates across the Owner Portal: "17 Nov 2026", 24-hour, Baghdad time. */
const base = { timeZone: "Asia/Baghdad", numberingSystem: "latn" } as const;
const dayFormat = new Intl.DateTimeFormat("en-GB", { ...base, day: "numeric", month: "short", year: "numeric" });
const timeFormat = new Intl.DateTimeFormat("en-GB", { ...base, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const toDate = (value: string | Date) => (value instanceof Date ? value : new Date(value));

export const day = (value: string | Date) => dayFormat.format(toDate(value));
export const time = (value: string | Date) => timeFormat.format(toDate(value));
export const when = (value: string | Date) => `${day(value)}, ${time(value)}`;
