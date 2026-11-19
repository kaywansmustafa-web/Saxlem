/**
 * How Saxlem collects what a doctor owes. Gentle and in order:
 *  1. Reminders: a statement is due DUE_DAYS after its 30 days end.
 *  2. Deduction: if still unpaid when the next statement ends, the balance
 *     moves into it and is taken from the doctor's app payments.
 *  3. Hiding: only if a balance is still unpaid HIDE_AFTER_DAYS after its due
 *     date is the doctor hidden from the patient app (phone and walk-in
 *     bookings keep working). A warning shows from WARN_AFTER_DAYS. Paying,
 *     or Saxlem giving more time (GRACE_DAYS), brings the doctor back.
 */
export const DUE_DAYS = 14;
export const WARN_AFTER_DAYS = 45;
export const HIDE_AFTER_DAYS = 60;
export const GRACE_DAYS = 30;
const DAY_MS = 86_400_000;

export type CollectionStage =
  'clear' | 'due' | 'overdue' | 'warning' | 'hidden';

export const dueAt = (periodEnd: Date) =>
  new Date(periodEnd.getTime() + DUE_DAYS * DAY_MS);

/** Where a doctor stands, from the due date of their oldest unpaid
 * balance. Grace pushes the warning and hiding back. */
export function collectionStage(input: {
  owedIqd: number;
  oldestDueAt: Date | null;
  graceUntil: Date | null;
  hiddenAt: Date | null;
  now: Date;
}): {
  stage: CollectionStage;
  warnOn: Date | null;
  hideOn: Date | null;
} {
  if (input.owedIqd <= 0 || !input.oldestDueAt)
    return { stage: 'clear', warnOn: null, hideOn: null };
  const due = input.oldestDueAt.getTime();
  const grace = input.graceUntil?.getTime() ?? 0;
  const hideOn = new Date(Math.max(due + HIDE_AFTER_DAYS * DAY_MS, grace));
  const warnOn = new Date(
    Math.max(
      due + WARN_AFTER_DAYS * DAY_MS,
      grace - (HIDE_AFTER_DAYS - WARN_AFTER_DAYS) * DAY_MS,
    ),
  );
  const now = input.now.getTime();
  const stage: CollectionStage =
    input.hiddenAt || now >= hideOn.getTime()
      ? 'hidden'
      : now >= warnOn.getTime()
        ? 'warning'
        : now >= due
          ? 'overdue'
          : 'due';
  return { stage, warnOn, hideOn };
}
