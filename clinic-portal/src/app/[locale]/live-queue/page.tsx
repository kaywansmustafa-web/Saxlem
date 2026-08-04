import { notFound } from "next/navigation";
import { isLocale } from "@/i18n";
import { clinicalComposition } from "@/infrastructure/clinical-composition";
import { PortalApiError } from "@/infrastructure/api/api-error";
import { ClinicalState } from "@/features/clinical-presentation/clinical-state";
import { clinicalMessages } from "@/features/clinical-presentation/messages";
import { productionQueueMessages } from "@/features/live-queue/presentation/production-messages";
import { ProductionQueueWorkspace } from "@/features/live-queue/presentation/production-queue-workspace";
import { cursor } from "@/features/live-queue/data/backend-queue-repository";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    doctorId?: string;
    cursor?: string;
    appointmentId?: string;
  }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const query = await searchParams;
  const result = await (async () => {
    try {
      const composition = await clinicalComposition(locale),
        doctors = await composition.queueDoctors.list(
          composition.context.clinicId,
        );
      if (!query.doctorId) return { ok: true, doctors } as const;
      const doctor = doctors.find((x) => x.id === query.doctorId);
      if (!doctor) return { ok: false, kind: "notFound" as const };
      let queue;
      try {
        queue = await composition.queues.current(
          composition.context.clinicId,
          doctor.id,
        );
      } catch (error) {
        if (!(error instanceof PortalApiError && error.detail.status === 404))
          throw error;
      }
      let page;
      if (queue) {
        const parsed = query.cursor ? cursor.safeParse(query.cursor) : null;
        if (query.cursor && !parsed?.success)
          return { ok: false, kind: "notFound" as const };
        page = await composition.queues.entries(queue.id, parsed?.data);
      }
      return {
        ok: true,
        doctors,
        doctorId: doctor.id,
        queue,
        page,
        appointmentId: query.appointmentId,
      } as const;
    } catch (error) {
      const kind =
        error instanceof PortalApiError
          ? error.detail.kind === "unauthorized"
            ? "unauthorized"
            : error.detail.kind === "forbidden"
              ? "forbidden"
              : error.detail.kind === "offline" ||
                  error.detail.kind === "timeout"
                ? "offline"
                : error.detail.status === 404
                  ? "notFound"
                  : "backendError"
          : "backendError";
      return { ok: false, kind } as const;
    }
  })();
  if (!result.ok)
    return <ClinicalState kind={result.kind} m={clinicalMessages(locale)} />;
  return (
    <ProductionQueueWorkspace
      key={`${result.doctorId ?? "selection"}:${result.queue?.id ?? "none"}:${result.queue?.version ?? 0}`}
      locale={locale}
      m={productionQueueMessages(locale)}
      doctors={result.doctors!}
      doctorId={result.doctorId}
      queue={result.queue}
      page={result.page}
      appointmentId={result.appointmentId}
    />
  );
}
