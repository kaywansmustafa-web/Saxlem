import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n";
import { clinicalComposition } from "@/infrastructure/clinical-composition";
import { PortalApiError } from "@/infrastructure/api/api-error";
import { ClinicalState } from "@/features/clinical-presentation/clinical-state";
import { clinicalMessages } from "@/features/clinical-presentation/messages";
import { iraqCalendarDate } from "@/features/appointments/domain/appointment-filter-contract";
import {
  bookingMessages,
  dayFormat,
} from "@/features/appointments/presentation/booking-messages";
import { AppointmentViews } from "@/features/appointments/presentation/appointment-views";
import { DayBoard } from "@/features/appointments/presentation/day-board";
import {
  ReceptionBar,
  ReceptionSetup,
} from "@/features/reception/presentation/reception-setup";

const shift = (date: string, days: number) => {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const today = iraqCalendarDate(new Date());
  const raw = (await searchParams).date;
  const date =
    typeof raw === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(raw) &&
    !Number.isNaN(Date.parse(`${raw}T00:00:00Z`))
      ? raw
      : today;
  const m = bookingMessages(locale);
  const cm = clinicalMessages(locale);
  let board, reception;
  try {
    const composition = await clinicalComposition(locale);
    reception = await composition.reception.view();
    if (!reception || reception.configured)
      board = await composition.appointments.board(date);
  } catch (error) {
    return (
      <ClinicalState
        kind={
          error instanceof PortalApiError &&
          (error.detail.kind === "offline" || error.detail.kind === "timeout")
            ? "offline"
            : error instanceof PortalApiError &&
                error.detail.kind === "forbidden"
              ? "forbidden"
              : "backendError"
        }
        m={cm}
      />
    );
  }
  if (!board)
    return reception ? (
      <ReceptionSetup view={reception} locale={locale} />
    ) : null;
  const label = dayFormat(locale, "UTC").format(
    new Date(`${date}T00:00:00.000Z`),
  );
  const href = (value: string) => `/${locale}/appointments/board?date=${value}`;
  return (
    <>
      <header className="heading">
        <p className="eyebrow">{cm.appointments}</p>
        <h1>{date === today ? m.boardTitle : label}</h1>
        <p>{m.boardHelp}</p>
        <div className="heading-actions">
          <AppointmentViews current="board" locale={locale} m={m} />
          <Link
            className="button-link primary"
            href={`/${locale}/appointments/new?mode=phone`}
          >
            {m.newBooking}
          </Link>
          <Link
            className="button-link secondary"
            href={`/${locale}/appointments/new?mode=walkIn`}
          >
            {m.walkIn}
          </Link>
        </div>
      </header>
      <ReceptionBar view={reception ?? null} locale={locale} />
      <nav className="board-dates" aria-label={m.day}>
        <Link href={href(shift(date, -1))} aria-label={m.previousDay}>
          <span aria-hidden="true">‹</span>
        </Link>
        <span className="board-date-label">{label}</span>
        <Link href={href(shift(date, 1))} aria-label={m.nextDay}>
          <span aria-hidden="true">›</span>
        </Link>
        {date !== today && (
          <Link className="board-today" href={href(today)}>
            {m.today}
          </Link>
        )}
        <form method="get" className="board-date-form">
          <label className="visually-hidden" htmlFor="board-date">
            {m.day}
          </label>
          <input id="board-date" name="date" type="date" defaultValue={date} />
          <button type="submit" className="secondary">
            {m.show}
          </button>
        </form>
      </nav>
      <DayBoard
        key={date}
        board={board}
        live={date === today}
        locale={locale}
        m={m}
      />
    </>
  );
}
