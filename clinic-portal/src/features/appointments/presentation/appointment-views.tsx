import Link from "next/link";
import type { Locale } from "@/i18n";
import type { BookingMessages } from "./booking-messages";

/** Switch between reception's day board and the appointment list. */
export function AppointmentViews({
  current,
  locale,
  m,
}: {
  current: "board" | "list";
  locale: Locale;
  m: BookingMessages;
}) {
  return (
    <nav className="booking-mode view-switch" aria-label={m.dayBoard}>
      <Link
        href={`/${locale}/appointments/board`}
        aria-current={current === "board" ? "page" : undefined}
      >
        {m.dayBoard}
      </Link>
      <Link
        href={`/${locale}/appointments`}
        aria-current={current === "list" ? "page" : undefined}
      >
        {m.list}
      </Link>
    </nav>
  );
}
