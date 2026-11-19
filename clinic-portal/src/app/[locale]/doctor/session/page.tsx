import { notFound } from "next/navigation";
import { isLocale } from "@/i18n";
import { DoctorDesk } from "@/features/workday/doctor-desk";
import { allAppointments, currentQueue } from "@/features/workday/load";
import { WorkdayError } from "@/features/workday/workday-error";
import { doctorComposition } from "@/infrastructure/doctor-composition";
import { clinicDay, clinicDayBounds, CLINIC_TIME_ZONE } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const desk = await doctorComposition(locale);
  const data = await (async () => {
    try {
      const me = await desk.me(),
        { from, to } = clinicDayBounds(clinicDay()),
        [appointments, queue] = await Promise.all([
          allAppointments(desk.appointments, from, to),
          currentQueue(desk.queues, desk.context.clinicId, me.id),
        ]);
      return { ok: true as const, me, appointments, queue };
    } catch (error) {
      return { ok: false as const, error };
    }
  })();
  if (!data.ok) return <WorkdayError locale={locale} error={data.error} />;
  const clinic = data.me.clinics.find((c) => c.id === desk.context.clinicId) ?? data.me.clinics[0];
  return (
    <DoctorDesk
      locale={locale}
      doctorName={data.me.displayName}
      specialty={data.me.specialty}
      clinicName={clinic?.name ?? ""}
      timeZone={data.queue?.summary.effectiveTimezone ?? CLINIC_TIME_ZONE}
      appointments={data.appointments}
      queue={data.queue?.summary ?? null}
      entries={data.queue?.entries ?? []}
    />
  );
}
