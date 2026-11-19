import { notFound } from "next/navigation";
import { isLocale } from "@/i18n";
import { SettingsView } from "@/features/workday/settings-view";
import { WorkdayError } from "@/features/workday/workday-error";
import { workdayMessages } from "@/features/workday/messages";
import { clinicalComposition } from "@/infrastructure/clinical-composition";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const m = workdayMessages(locale);
  const result = await (async () => {
    try {
      const composition = await clinicalComposition(locale),
        reception = await composition.reception.view(),
        doctors = (await composition.queueDoctors.list(composition.context.clinicId)).filter(
          (d) => !reception?.configured || reception.doctors.some((r) => r.id === d.id && r.assigned),
        );
      return { ok: true as const, role: reception ? ("receptionist" as const) : ("clinicManager" as const), doctors };
    } catch (error) {
      return { ok: false as const, error };
    }
  })();
  if (!result.ok) return <WorkdayError locale={locale} error={result.error} />;
  return (
    <SettingsView
      locale={locale}
      role={result.role}
      path={`/${locale}/settings`}
      facts={[{ label: m.doctorsTitle, value: result.doctors.map((d) => d.displayName).join(", ") || "—" }]}
    />
  );
}
