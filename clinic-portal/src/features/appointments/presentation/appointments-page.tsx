import { formatter } from "@/lib/format";
import Link from "next/link";
import type { Locale } from "@/i18n";
import type {
  AppointmentPage,
  BackendAppointmentStatus,
} from "../data/backend-appointment-repository";
import type { ClinicalMessages } from "@/features/clinical-presentation/messages";
import type { BackendPayment } from "@/features/payments/data/backend-payment-repository";
import {
  paymentMessages,
  paymentTone,
} from "@/features/payments/presentation/messages";
import { bookingMessages, originLabel } from "./booking-messages";
import { AppointmentViews } from "./appointment-views";
import { iraqCalendarDate } from "../domain/appointment-filter-contract";

const statuses: readonly BackendAppointmentStatus[] = [
  "scheduled",
  "confirmed",
  "cancelled",
  "completed",
  "noShow",
];
export function AppointmentsPage({
  page,
  payments,
  locale,
  m,
  filters,
  validationMessage,
  toolbar,
}: {
  /** Shown under the heading (the receptionist's "My doctors"). */
  toolbar?: React.ReactNode;
  page: AppointmentPage;
  payments?: ReadonlyMap<string, BackendPayment>;
  locale: Locale;
  m: ClinicalMessages;
  filters: {
    from: string;
    to: string;
    status?: BackendAppointmentStatus;
    cursor?: string;
    trail: readonly string[];
  };
  validationMessage?: string;
}) {
  const pm = paymentMessages(locale);
  const bm = bookingMessages(locale);
  const link = (cursor?: string, trail: readonly string[] = []) => {
    const q = new URLSearchParams({ from: filters.from, to: filters.to });
    if (filters.status) q.set("status", filters.status);
    if (cursor) q.set("cursor", cursor);
    if (trail.length) q.set("trail", JSON.stringify(trail));
    return `/${locale}/appointments?${q}`;
  };
  const f = formatter(locale),
    today = iraqCalendarDate(),
    ranges = [
      { label: bm.today, from: today, to: today },
      { label: bm.tomorrow, from: addDays(today, 1), to: addDays(today, 1) },
      { label: bm.nextSevenDays, from: today, to: addDays(today, 6) },
    ],
    rangeLink = (from: string, to: string) => {
      const q = new URLSearchParams({ from, to });
      if (filters.status) q.set("status", filters.status);
      return `/${locale}/appointments?${q}`;
    };
  return (
    <div className="ax-page">
      <header className="ax-hero">
        <div>
          <p className="ax-eyebrow">{bm.list}</p>
          <h1 className="ax-title">{m.appointments}</h1>
          <p className="ax-lead">{m.appointmentHelp}</p>
        </div>
        <div className="ax-hero-side ax-actions">
          <Link
            className="ax-btn ax-btn-primary"
            href={`/${locale}/appointments/new?mode=phone`}
          >
            {bm.newBooking}
          </Link>
          <Link
            className="ax-btn"
            href={`/${locale}/appointments/new?mode=walkIn`}
          >
            {bm.walkIn}
          </Link>
        </div>
      </header>
      <AppointmentViews current="list" locale={locale} m={bm} />
      {toolbar}
      <section className="ax-card ax-filters">
        <nav className="ax-choice" aria-label={bm.quickRange}>
          {ranges.map((r) => (
            <Link
              key={r.label}
              className="ax-choice-item"
              href={rangeLink(r.from, r.to)}
              aria-current={
                filters.from === r.from && filters.to === r.to
                  ? "true"
                  : undefined
              }
            >
              {r.label}
            </Link>
          ))}
        </nav>
        <form className="ax-filter-form" method="get">
          <label>
            {m.from}
            <input name="from" type="date" defaultValue={filters.from} />
          </label>
          <label>
            {m.to}
            <input name="to" type="date" defaultValue={filters.to} />
          </label>
          <label>
            {m.status}
            <select name="status" defaultValue={filters.status ?? ""}>
              <option value="">{m.allStatuses}</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {m[s]}
                </option>
              ))}
            </select>
          </label>
          <button className="ax-btn ax-btn-primary" type="submit">
            {m.apply}
          </button>
        </form>
      </section>
      {validationMessage && (
        <p className="ax-alert" role="alert">
          {validationMessage}
        </p>
      )}
      {page.items.length ? (
        <section className="ax-card ax-table-card">
          <div className="table-wrap">
            <table>
              <caption className="visually-hidden">{m.appointments}</caption>
              <thead>
                <tr>
                  <th scope="col">{m.date}</th>
                  <th scope="col">{m.patient}</th>
                  <th scope="col">{m.doctor}</th>
                  <th scope="col">{bm.source}</th>
                  <th scope="col">{m.status}</th>
                  {payments && <th scope="col">{pm.payment}</th>}
                  <th scope="col">
                    <span className="visually-hidden">{m.actions}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {page.items.map((a) => {
                  const payment = payments
                    ? (payments.get(a.id)?.status ??
                      (a.status === "cancelled" ? "void" : "dueAtCounter"))
                    : undefined;
                  return (
                    <tr
                      key={a.id}
                      className={
                        a.status === "cancelled" ? "is-done" : undefined
                      }
                    >
                      <td>
                        <time className="ax-when" dateTime={a.startsAt}>
                          <strong>{f.time(a.startsAt)}</strong>
                          <small>
                            {f.weekdayShort(a.startsAt)}{" "}
                            {f.dayNoYear(a.startsAt)}
                          </small>
                        </time>
                      </td>
                      <td>
                        <span className="ax-cell-stack">
                          <strong>{a.patientName}</strong>
                          <small>
                            {m.reference} <bdi>{a.reference}</bdi>
                          </small>
                        </span>
                      </td>
                      <td>{a.doctorName}</td>
                      <td>
                        <span className={`ax-chip ${originTone(a.origin)}`}>
                          {originLabel(a.origin, bm) ?? "-"}
                        </span>
                      </td>
                      <td>
                        <span className={`ax-chip ${statusTone(a.status)}`}>
                          {m[a.status]}
                        </span>
                      </td>
                      {payment && (
                        <td>
                          <span
                            className={`ax-chip ${chipTone(paymentTone(payment))}`}
                          >
                            {pm[payment]}
                          </span>
                        </td>
                      )}
                      <td className="ax-cell-end">
                        <Link
                          className="ax-btn ax-btn-sm"
                          href={`/${locale}/appointments/${a.id}`}
                        >
                          {m.view}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <div className="ax-card ax-empty" role="status">
          {m.noAppointments}
        </div>
      )}
      <nav
        className="ax-actions ax-actions-center pagination"
        aria-label={m.appointments}
      >
        {filters.cursor && (
          <Link
            className="ax-btn"
            href={link(filters.trail.at(-1), filters.trail.slice(0, -1))}
          >
            {m.previous}
          </Link>
        )}
        {page.nextCursor && (
          <Link
            className="ax-btn"
            href={link(
              page.nextCursor,
              filters.cursor
                ? [...filters.trail, filters.cursor]
                : filters.trail,
            )}
          >
            {m.next}
          </Link>
        )}
      </nav>
    </div>
  );
}

function addDays(day: string, days: number) {
  const at = new Date(`${day}T00:00:00.000Z`);
  at.setUTCDate(at.getUTCDate() + days);
  return at.toISOString().slice(0, 10);
}
function statusTone(status: BackendAppointmentStatus) {
  return status === "completed"
    ? "is-ok"
    : status === "noShow"
      ? "is-bad"
      : status === "cancelled"
        ? "is-muted"
        : status === "confirmed"
          ? "is-brand"
          : "is-soft";
}
function chipTone(tone: "positive" | "info" | "warning" | "neutral") {
  return tone === "positive"
    ? "is-ok"
    : tone === "warning"
      ? "is-warn"
      : tone === "info"
        ? "is-brand"
        : "is-muted";
}
function originTone(origin?: "patientBooked" | "clinicCreated" | "walkIn") {
  return origin === "walkIn"
    ? "is-walkin"
    : origin === "clinicCreated"
      ? "is-phone"
      : "is-app";
}
