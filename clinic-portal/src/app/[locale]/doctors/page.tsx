import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n";
import { ReceptionBar, ReceptionSetup, ownDoctorIds } from "@/features/reception/presentation/reception-setup";
import { currentQueue } from "@/features/workday/load";
import { workdayMessages } from "@/features/workday/messages";
import { WeeklyHours } from "@/features/workday/schedule-parts";
import { WorkdayError } from "@/features/workday/workday-error";
import { doctorSettingsMessages } from "@/features/doctor-settings/presentation/messages";
import { clinicalComposition } from "@/infrastructure/clinical-composition";
import { clinicDay } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const m = workdayMessages(locale);
  const settings = doctorSettingsMessages(locale);
  const result = await (async () => {
    try {
      const composition = await clinicalComposition(locale),
        reception = await composition.reception.view();
      if (reception && !reception.configured) return { ok: true as const, setup: reception };
      const own = ownDoctorIds(reception),
        doctors = (await composition.queueDoctors.list(composition.context.clinicId)).filter((d) => !own || own.has(d.id)),
        rows = await Promise.all(
          doctors.map(async (doctor) => ({
            doctor,
            schedule: await composition.schedule(doctor.id),
            queue: await currentQueue(composition.queues, composition.context.clinicId, doctor.id),
          })),
        );
      return { ok: true as const, reception, rows, clinicId: composition.context.clinicId };
    } catch (error) {
      return { ok: false as const, error };
    }
  })();
  if (!result.ok) return <WorkdayError locale={locale} error={result.error} />;
  if ("setup" in result) return <ReceptionSetup view={result.setup!} locale={locale} />;
  const todayWeekday = new Date(`${clinicDay()}T12:00:00Z`).getUTCDay();
  return (
    <div className="ax-page">
      <header className="ax-hero">
        <div>
          <h1 className="ax-title">{m.doctorsTitle}</h1>
          <p className="ax-lead">{m.doctorsLead}</p>
        </div>
      </header>
      <ReceptionBar view={result.reception ?? null} locale={locale} />
      <div className="ax-doctor-days">
        {result.rows.map(({ doctor, schedule, queue }) => {
          const clinic = schedule.clinics.find((c) => c.clinicId === result.clinicId) ?? schedule.clinics[0];
          return (
            <section key={doctor.id} className="ax-card" aria-label={doctor.displayName}>
              <div className="ax-card-head">
                <div className="ax-doctor-name">
                  <span className="ax-avatar ax-avatar-sm" aria-hidden="true">
                    {doctor.displayName.replace(/^Dr\.?\s*/i, "").slice(0, 1)}
                  </span>
                  <h2 className="ax-card-title">{doctor.displayName}</h2>
                </div>
                <span className={`ax-chip ${queue?.summary.status === "open" ? "is-ok" : queue?.summary.status === "paused" ? "is-warn" : "is-muted"}`}>
                  {queue?.summary.status === "open"
                    ? `${m.queueOpen} · ${m.peopleWaiting(queue.summary.waitingCount)}`
                    : queue?.summary.status === "paused"
                      ? m.queuePaused
                      : m.queueClosed}
                </span>
              </div>
              <h3 className="ax-subtitle">{m.weeklyHours}</h3>
              {clinic && <WeeklyHours m={m} clinic={clinic} todayWeekday={todayWeekday} />}
              <div className="ax-actions">
                <Link className="ax-btn" href={`/${locale}/doctors/${doctor.id}`} aria-label={`${settings.link}: ${doctor.displayName}`}>
                  {settings.link}
                </Link>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
