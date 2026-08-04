import { notFound } from "next/navigation";
import { isLocale } from "@/i18n";
import { doctorServices } from "@portal-composition";
import { projectDoctorPatients } from "@/features/doctor-patients/application/project-doctor-patients";
import { DoctorPatientsView } from "@/features/doctor-patients/presentation/doctor-patients-view";
import { doctorPatientsMessages } from "@/features/doctor-patients/presentation/messages";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; destination: string }>;
}) {
  const { locale, destination } = await params;

  if (!isLocale(locale) || destination !== "patients") notFound();

  const m = doctorPatientsMessages(locale);
  const services = doctorServices();

  if (!services) {
    return (
      <div className="state">
        <div>
          <h1>{m.unavailable}</h1>
          <p>{m.unavailableBody}</p>
        </div>
      </div>
    );
  }

  const workspace = await services.get.execute(services.session.id);

  if (!workspace) notFound();

  return (
    <DoctorPatientsView
      data={projectDoctorPatients(workspace)}
      locale={locale}
      m={m}
    />
  );
}
