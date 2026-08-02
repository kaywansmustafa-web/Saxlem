import Link from "next/link";
import type { Locale } from "@/i18n";
import type {
  AppointmentPage,
  BackendAppointmentStatus,
} from "../data/backend-appointment-repository";
import type { ClinicalMessages } from "@/features/clinical-presentation/messages";

const statuses: readonly BackendAppointmentStatus[] = [
  "scheduled",
  "confirmed",
  "cancelled",
  "completed",
  "noShow",
];
export function AppointmentsPage({
  page,
  locale,
  m,
  filters,
  validationMessage,
}: {
  page: AppointmentPage;
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
  const link = (cursor?: string, trail: readonly string[] = []) => {
    const q = new URLSearchParams({ from: filters.from, to: filters.to });
    if (filters.status) q.set("status", filters.status);
    if (cursor) q.set("cursor", cursor);
    if (trail.length) q.set("trail", JSON.stringify(trail));
    return `/${locale}/appointments?${q}`;
  };
  return (
    <>
      <header className="heading">
        <p className="eyebrow">{m.appointments}</p>
        <h1>{m.appointments}</h1>
        <p>{m.appointmentHelp}</p>
      </header>
      <form className="clinical-filters" method="get">
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
        <button type="submit">{m.apply}</button>
      </form>
      {validationMessage && <p role="alert">{validationMessage}</p>}
      {page.items.length ? (
        <div className="table-wrap">
          <table>
            <caption className="visually-hidden">{m.appointments}</caption>
            <thead>
              <tr>
                <th>{m.date}</th>
                <th>{m.patient}</th>
                <th>{m.doctor}</th>
                <th>{m.status}</th>
                <th>{m.reference}</th>
                <th>{m.actions}</th>
              </tr>
            </thead>
            <tbody>
              {page.items.map((a) => (
                <tr key={a.id}>
                  <td>
                    <time dateTime={a.startsAt}>
                      {new Date(a.startsAt).toLocaleString(locale)}
                    </time>
                  </td>
                  <td>{a.patientName}</td>
                  <td>{a.doctorName}</td>
                  <td>
                    <span className="pill info">{m[a.status]}</span>
                  </td>
                  <td>
                    <bdi>{a.reference}</bdi>
                  </td>
                  <td>
                    <Link
                      className="link"
                      href={`/${locale}/appointments/${a.id}`}
                    >
                      {m.view}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="compact-state" role="status">
          {m.noAppointments}
        </div>
      )}
      <nav className="pagination" aria-label={m.appointments}>
        {filters.cursor && (
          <Link href={link(filters.trail.at(-1), filters.trail.slice(0, -1))}>
            {m.previous}
          </Link>
        )}
        {page.nextCursor && (
          <Link
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
    </>
  );
}
