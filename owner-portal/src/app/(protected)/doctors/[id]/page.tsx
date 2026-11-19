import { notFound } from "next/navigation";
import { PageHeader, StatusBadge } from "@/components/app-shell";
import { DoctorEditForm } from "@/components/doctor-edit-form";
import { DoctorSpecialtiesForm } from "@/components/app-config/doctor-specialties-form";
import { DoctorHoursCard } from "@/components/app-config/doctor-hours-card";
import { doctorHours, listCatalogSpecialties } from "@/data/app-catalog";
import { doctorDetail } from "@/data/owner-data";
import { requireOwnerSession } from "@/infrastructure/auth";
import { z } from "zod";
export default async function DoctorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const session = await requireOwnerSession();
  const [doctor, specialties, hours] = await Promise.all([
    doctorDetail(session, id),
    listCatalogSpecialties(session),
    doctorHours(session, id),
  ]);
  return (
    <>
      <PageHeader
        title={doctor.displayName}
        description="Profile, specialties, working hours and booking."
      />
      <div className="grid split">
        <section className="card detail-card">
          <h2>Professional identity</h2>
          <p>
            <StatusBadge status={doctor.status} />
          </p>
          <dl>
            <dt>License</dt>
            <dd>{doctor.licenseNumber}</dd>
            <dt>Specialties</dt>
            <dd>
              {doctor.specialties.length
                ? doctor.specialties
                    .map((s) => (s.isPrimary ? `${s.displayName} (main)` : s.displayName))
                    .join(", ")
                : "None: patients can't find this doctor"}
            </dd>
            <dt>Clinics</dt>
            <dd>{doctor.clinics.map((clinic) => clinic.name).join(", ")}</dd>
            <dt>Fees patients see</dt>
            <dd>
              First visit {doctor.fees.firstVisitIqd.toLocaleString("en-US")}{" "}
              IQD · Follow-up{" "}
              {doctor.fees.followUpIqd.toLocaleString("en-US")} IQD
            </dd>
          </dl>
        </section>
        <DoctorEditForm doctor={doctor} />
        <DoctorSpecialtiesForm
          doctorId={doctor.id}
          current={doctor.specialties.map((s) => s.id)}
          primaryId={doctor.specialties.find((s) => s.isPrimary)?.id ?? null}
          specialties={specialties
            .filter((s) => s.status === "active" || doctor.specialties.some((d) => d.id === s.id))
            .map((s) => ({ id: s.id, nameEn: s.status === "active" ? s.nameEn : `${s.nameEn} (hidden)` }))}
        />
      </div>
      <DoctorHoursCard hours={hours} />
    </>
  );
}
