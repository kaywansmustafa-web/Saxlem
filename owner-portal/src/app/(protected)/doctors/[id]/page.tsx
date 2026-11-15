import { notFound } from "next/navigation";
import { PageHeader, StatusBadge } from "@/components/app-shell";
import { DoctorEditForm } from "@/components/doctor-edit-form";
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
  const doctor = await doctorDetail(await requireOwnerSession(), id);
  return (
    <>
      <PageHeader
        title={doctor.displayName}
        description="Authoritative professional profile and allowed administrative fields."
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
            <dt>Specialty</dt>
            <dd>{doctor.specialty}</dd>
            <dt>Clinics</dt>
            <dd>{doctor.clinics.map((clinic) => clinic.name).join(", ")}</dd>
          </dl>
        </section>
        <DoctorEditForm doctor={doctor} />
      </div>
    </>
  );
}
