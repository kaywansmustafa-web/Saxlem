import { notFound } from "next/navigation";
import { isLocale } from "@/i18n";
import { SettingsView } from "@/features/workday/settings-view";
import { WorkdayError } from "@/features/workday/workday-error";
import { doctorComposition } from "@/infrastructure/doctor-composition";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const desk = await doctorComposition(locale);
  const data = await (async () => {
    try {
      const me = await desk.me();
      return { ok: true as const, me, profile: await desk.profile(me.id) };
    } catch (error) {
      return { ok: false as const, error };
    }
  })();
  if (!data.ok) return <WorkdayError locale={locale} error={data.error} />;
  return (
    <SettingsView
      locale={locale}
      role="doctor"
      path={`/${locale}/doctor/settings`}
      clinicName={data.me.clinics.find((c) => c.id === desk.context.clinicId)?.name}
      profile={data.profile}
    />
  );
}
