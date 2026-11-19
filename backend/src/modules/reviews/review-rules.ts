/**
 * Built-in defaults; the live values are Owner Portal settings
 * (reviews.windowDays, reviews.commentMax).
 */
export const REVIEW_WINDOW_DAYS = 30;
export const COMMENT_MAX = 500;

/**
 * Reviews are public: no links, phone numbers or emails (they would turn
 * reviews into advertising or expose people).
 */
const FORBIDDEN = [
  /(https?:\/\/|www\.)/i,
  /\S+@\S+\.\S+/,
  /(\+?\d[\d\s-]{6,}\d)/,
];

export function cleanComment(
  raw: string | null | undefined,
  max = COMMENT_MAX,
): string | null {
  const text = (raw ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return null;
  if (text.length > max) throw new Error('COMMENT_TOO_LONG');
  if (FORBIDDEN.some((pattern) => pattern.test(text)))
    throw new Error('COMMENT_HAS_CONTACT');
  return text;
}

/** "Avin K." — first name and the first letter of the last name. */
export function authorName(firstName: string, lastName: string): string {
  const first = firstName.trim();
  const initial = [...lastName.trim()][0];
  return (initial ? `${first} ${initial}.` : first).slice(0, 80);
}

export function averageOf(count: number, sum: number): number {
  return count ? Math.round((sum / count) * 10) / 10 : 0;
}
