import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n";
import { PortalApiError } from "@/infrastructure/api/api-error";
import { clinicalComposition } from "@/infrastructure/clinical-composition";
import { DoctorSettings } from "@/features/doctor-settings/presentation/doctor-settings";
import { doctorSettingsMessages } from "@/features/doctor-settings/presentation/messages";
import { WorkdayError } from "@/features/workday/workday-error";
import { formatter } from "@/lib/format";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Clinic Portal → Doctors → a doctor: hours, time off, booking, fees, profile. */
export default async function Page({ params }: { params: Promise<{ locale: string; doctorId: string }> }) {
  const { locale, doctorId } = await params;
  if (!isLocale(locale) || !UUID.test(doctorId)) notFound();
  const m = doctorSettingsMessages(locale);
  const result = await (async () => {
    try {
      return { ok: true as const, view: await (await clinicalComposition(locale)).doctorSettings.view(doctorId) };
    } catch (error) {
      return { ok: false as const, error };
    }
  })();
  const back = (
    <Link className="ds-back" href={`/${locale}/doctors`}>
      {m.back}
    </Link>
  );
  if (!result.ok) {
    const status = result.error instanceof PortalApiError ? result.error.detail.status : 0;
    if (status !== 403 && status !== 404) return <WorkdayError locale={locale} error={result.error} />;
    return (
      <div className="ax-page">
        {back}
        <div className="ax-card ax-empty ax-empty-lg" role="alert">
          <p>{status === 403 ? m.notYours : m.notFound}</p>
        </div>
      </div>
    );
  }
  const { view } = result;
  const f = formatter(locale, view.timezone);
  const specialties = view.specialties.map((s) => (locale === "en" ? s.en : (s[locale] ?? s.en)));
  return (
    <div className="ax-page ds-page">
      {back}
      <header className="ax-hero">
        <div>
          <p className="ax-eyebrow">{m.eyebrow}</p>
          <h1 className="ax-title">{view.displayName}</h1>
          <p className="ax-lead">{m.lead(view.clinicName)}</p>
        </div>
        <div className="ax-hero-side">
          <span className={`ax-chip ${view.nextAvailableAt ? "is-ok" : "is-muted"}`}>
            {m.nextFree}: {view.nextAvailableAt ? f.dayTime(view.nextAvailableAt) : m.nextFreeNone}
          </span>
        </div>
      </header>
      <p className="ds-saxlem">
        {specialties.length > 0 && <strong>{specialties.join(f.comma)}</strong>} {m.saxlemOnly}
      </p>
      <DoctorSettings view={view} locale={locale} />
    </div>
  );
}
