import { notFound } from "next/navigation";
import { isLocale } from "@/i18n";
import type { BackendAppointment } from "@/features/appointments/data/backend-appointment-repository";
import { allAppointments } from "@/features/workday/load";
import { workdayMessages } from "@/features/workday/messages";
import { WeeklyHours } from "@/features/workday/schedule-parts";
import { WorkdayError } from "@/features/workday/workday-error";
import { doctorComposition } from "@/infrastructure/doctor-composition";
import { clinicDay, clinicDayBounds, formatter } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const desk = await doctorComposition(locale),
    m = workdayMessages(locale);
  const data = await (async () => {
    try {
      const me = await desk.me(),
        today = clinicDay(),
        from = clinicDayBounds(today).from,
        to = new Date(new Date(from).getTime() + 7 * 86_400_000).toISOString(),
        [schedule, appointments] = await Promise.all([
          desk.schedule(me.id, desk.context.clinicId),
          allAppointments(desk.appointments, from, to),
        ]);
      return { ok: true as const, schedule, appointments, today };
    } catch (error) {
      return { ok: false as const, error };
    }
  })();
  if (!data.ok) return <WorkdayError locale={locale} error={data.error} />;
  const clinic = data.schedule.clinics.find((c) => c.clinicId === desk.context.clinicId) ?? data.schedule.clinics[0];
  const f = formatter(locale, clinic?.timezone);
  const days = new Map<string, BackendAppointment[]>();
  for (const appointment of data.appointments.filter((a) => a.status !== "cancelled")) {
    const key = clinicDay(new Date(appointment.startsAt), clinic?.timezone);
    days.set(key, [...(days.get(key) ?? []), appointment]);
  }
  const todayWeekday = new Date(`${data.today}T12:00:00Z`).getUTCDay();
  const leave = [...(clinic?.leave ?? []), ...(clinic?.holidays ?? [])].filter((l) => new Date(l.endsAt) > new Date());
  return (
    <div className="ax-page">
      <header className="ax-hero">
        <div>
          <p className="ax-eyebrow">{clinic?.clinicName}</p>
          <h1 className="ax-title">{m.scheduleTitle}</h1>
          <p className="ax-lead">{m.scheduleLead}</p>
        </div>
      </header>
      <div className="ax-split">
        <section className="ax-card" aria-labelledby="hours-title">
          <h2 id="hours-title" className="ax-card-title">
            {m.weeklyHours}
          </h2>
          {clinic && <WeeklyHours m={m} clinic={clinic} todayWeekday={todayWeekday} />}
          <h2 className="ax-card-title ax-gap-top">{m.leave}</h2>
          {leave.length === 0 ? (
            <p className="ax-muted">{m.noLeave}</p>
          ) : (
            <ul className="ax-list">
              {leave.map((l) => (
                <li key={l.startsAt} className="ax-row">
                  <span className="ax-row-main">
                    <strong>
                      {f.day(l.startsAt)} – {f.day(new Date(new Date(l.endsAt).getTime() - 1))}
                    </strong>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="ax-card" aria-labelledby="upcoming-title">
          <div className="ax-card-head">
            <h2 id="upcoming-title" className="ax-card-title">
              {m.upcoming}
            </h2>
            <span className="ax-muted">{m.appointmentsCount([...days.values()].flat().length)}</span>
          </div>
          {days.size === 0 ? (
            <p className="ax-muted ax-pad">{m.noAppointments}</p>
          ) : (
            [...days.entries()].map(([day, items]) => (
              <div key={day} className="ax-day">
                <h3 className="ax-day-head">
                  <span>{day === data.today ? m.today : f.weekdayDay(`${day}T12:00:00Z`)}</span>
                  <span className="ax-count">{items.length}</span>
                </h3>
                <ol className="ax-timeline">
                  {items.map((a) => (
                    <li key={a.id} className="ax-slot">
                      <time dateTime={a.startsAt}>{f.time(a.startsAt)}</time>
                      <span className="ax-row-main">
                        <strong>{a.patientName}</strong>
                        <small>
                          {a.type === "followUp" ? m.followUp : m.firstVisit}
                          {a.reason ? ` · ${a.reason}` : ""}
                        </small>
                      </span>
                      <span className={`ax-chip is-${a.origin === "walkIn" ? "walkin" : a.origin === "clinicCreated" ? "phone" : "app"}`}>
                        {a.origin === "walkIn" ? m.walkInShort : a.origin === "clinicCreated" ? m.phone : m.app}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
