export const iqd = (value: number) =>
  `${(value === 0 ? 0 : value).toLocaleString("en-IQ")} IQD`;

export const baghdadDateTime = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-IQ", {
        timeZone: "Asia/Baghdad",
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";

/** Current Baghdad month as YYYY-MM. */
export function currentMonth(now = new Date()) {
  const baghdad = new Date(now.getTime() + 3 * 3_600_000);
  return `${baghdad.getUTCFullYear()}-${String(baghdad.getUTCMonth() + 1).padStart(2, "0")}`;
}

export const payoutStatusLabel = {
  open: ["Month running", "info"],
  ready: ["Ready to pay", "warning"],
  settled: ["Paid", "success"],
} as const;
