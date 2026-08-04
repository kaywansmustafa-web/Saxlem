import { notFound } from "next/navigation";
import { isLocale } from "@/i18n";
import { clinicalComposition } from "@/infrastructure/clinical-composition";
import { PortalApiError } from "@/infrastructure/api/api-error";
import { ClinicalState } from "@/features/clinical-presentation/clinical-state";
import { clinicalMessages } from "@/features/clinical-presentation/messages";
import { arrivalMessages } from "@/features/arrivals/presentation/messages";
import { ArrivalWorkspace } from "@/features/arrivals/presentation/arrival-workspace";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; appointmentId: string }>;
}) {
  const { locale, appointmentId } = await params;
  if (!isLocale(locale)) notFound();
  const result = await (async () => {
    try {
      const composition = await clinicalComposition(locale),
        [appointment, arrival] = await Promise.all([
          composition.appointments.get(appointmentId),
          composition.arrivals.get(appointmentId),
        ]);
      return { ok: true, appointment, arrival } as const;
    } catch (error) {
      const kind =
        error instanceof PortalApiError
          ? error.detail.status === 404
            ? "notFound"
            : error.detail.kind === "unauthorized"
              ? "unauthorized"
              : error.detail.kind === "forbidden"
                ? "forbidden"
                : error.detail.kind === "offline" ||
                    error.detail.kind === "timeout"
                  ? "offline"
                  : "backendError"
          : "backendError";
      return { ok: false, kind } as const;
    }
  })();
  if (!result.ok)
    return <ClinicalState kind={result.kind} m={clinicalMessages(locale)} />;
  return (
    <ArrivalWorkspace
      appointment={result.appointment}
      initialArrival={result.arrival}
      locale={locale}
      m={arrivalMessages(locale)}
    />
  );
}
