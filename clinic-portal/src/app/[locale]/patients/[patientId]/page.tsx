import { notFound } from "next/navigation";
import { isLocale } from "@/i18n";
import { clinicalComposition } from "@/infrastructure/clinical-composition";
import { PortalApiError } from "@/infrastructure/api/api-error";
import { PatientDirectoryDetailView } from "@/features/patients/presentation/patient-directory-detail";
import { ClinicalState } from "@/features/clinical-presentation/clinical-state";
import { clinicalMessages } from "@/features/clinical-presentation/messages";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; patientId: string }>;
}) {
  const { locale, patientId } = await params;
  if (!isLocale(locale)) notFound();
  const m = clinicalMessages(locale);
  let patient;
  try {
    patient=await(await clinicalComposition(locale)).patients.get(patientId);
  } catch (error) {
    const kind =
      error instanceof PortalApiError
        ? error.detail.status === 404
          ? "notFound"
          : error.detail.kind === "offline" || error.detail.kind === "timeout"
            ? "offline"
            : error.detail.kind === "unauthorized"
              ? "unauthorized"
              : error.detail.kind === "forbidden"
                ? "forbidden"
                : "backendError"
        : "backendError";
    return <ClinicalState kind={kind} m={m} />;
  }
  return <PatientDirectoryDetailView patient={patient} locale={locale} m={m}/>;
}
