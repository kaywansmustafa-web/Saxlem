import { notFound } from "next/navigation";
import { isLocale } from "@/i18n";
import { ReceptionSetup, ownDoctorIds } from "@/features/reception/presentation/reception-setup";
import { currentQueue } from "@/features/workday/load";
import { ReceptionToday, type DoctorDay } from "@/features/workday/reception-today";
import { WorkdayError } from "@/features/workday/workday-error";
import { clinicalComposition } from "@/infrastructure/clinical-composition";
import { clinicDay } from "@/lib/format";

export const dynamic = "force-dynamic";

/** Free times still ahead today (read at request time). */
function freeFromNow(slots: readonly { state: string; startsAt: string }[]) {
  const now = Date.now();
  return slots.filter((s) => s.state === "free" && new Date(s.startsAt).getTime() > now).length;
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const result = await (async () => {
    try {
      const composition = await clinicalComposition(locale),
        reception = await composition.reception.view();
      if (reception && !reception.configured) return { ok: true as const, setup: reception };
      const own = ownDoctorIds(reception),
        board = await composition.appointments.board(clinicDay()),
        columns = board.doctors.filter((d) => !own || own.has(d.doctorId)),
        days: DoctorDay[] = await Promise.all(
          columns.map(async (column) => {
            const queue = await currentQueue(composition.queues, composition.context.clinicId, column.doctorId);
            return {
              doctorId: column.doctorId,
              doctorName: column.doctorName,
              freeLater: freeFromNow(column.slots),
              appointments: column.slots
                .filter((s) => s.appointment)
                .map((s) => ({
                  id: s.appointment!.id,
                  startsAt: s.startsAt,
                  patientName: s.appointment!.patientName,
                  origin: s.appointment!.origin,
                  status: s.appointment!.status,
                })),
              queue: queue?.summary ?? null,
              entries: queue?.entries ?? [],
            };
          }),
        );
      return { ok: true as const, days, timeZone: board.clinicTimezone };
    } catch (error) {
      return { ok: false as const, error };
    }
  })();
  if (!result.ok) return <WorkdayError locale={locale} error={result.error} />;
  if ("setup" in result) return <ReceptionSetup view={result.setup!} locale={locale} />;
  return <ReceptionToday locale={locale} timeZone={result.timeZone} days={result.days} />;
}
