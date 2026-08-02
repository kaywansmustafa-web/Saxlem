import { notFound } from "next/navigation";
import { isLocale } from "@/i18n";
import { clinicalComposition } from "@/infrastructure/clinical-composition";
import { PortalApiError } from "@/infrastructure/api/api-error";
import { AppointmentWorkspace } from "@/features/appointments/presentation/appointment-workspace";
import { ClinicalState } from "@/features/clinical-presentation/clinical-state";
import { clinicalMessages } from "@/features/clinical-presentation/messages";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; appointmentId: string }>;
}) {
  const { locale, appointmentId } = await params;
  if (!isLocale(locale)) notFound();
  const m = clinicalMessages(locale);
  let appointment;
  try {
    appointment=await(await clinicalComposition(locale)).appointments.get(appointmentId);
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
    return <ClinicalState kind={kind} m={m} />;
  }
  return <AppointmentWorkspace appointment={appointment} locale={locale} m={m}/>;
}
