export function formatIqd(value: number, locale: string): string {
  if (!Number.isSafeInteger(value)) throw new Error("Invalid IQD amount.");
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value)} IQD`;
}
