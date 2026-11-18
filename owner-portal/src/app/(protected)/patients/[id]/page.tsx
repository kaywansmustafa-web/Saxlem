import { when } from "@/domain/format";
import { notFound } from "next/navigation";
import { PageHeader, StatusBadge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { patientDetail } from "@/data/owner-data";
import { requireOwnerSession } from "@/infrastructure/auth";
import { z } from "zod";
export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const patient = await patientDetail(await requireOwnerSession(), id);
  return (
    <>
      <PageHeader
        title={patient.displayName}
        description="Account details only. Medical records are never shown here."
      />
      <div className="grid split">
        <section className="card detail-card">
          <h2>Account</h2>
          <p>
            <StatusBadge status={patient.status} />
          </p>
          <p>Phone: {patient.maskedPhone}</p>
          <p>
            {patient.profileCount} profiles · {patient.appointmentCount}{" "}
            appointments
          </p>
        </section>
        <section className="card detail-card">
          <h2>Profiles</h2>
          <ul>
            {patient.profiles.map((profile) => (
              <li key={profile.id}>
                {profile.firstName} {profile.lastName} · {profile.relationship}
              </li>
            ))}
          </ul>
        </section>
      </div>
      <h2>Recent administrative appointment history</h2>
      <DataTable
        headers={["Reference", "Profile", "Clinic", "Time", "Status"]}
        rows={patient.appointments.map((item) => [
          item.publicReference,
          item.patientProfileId.slice(0, 8),
          item.clinicId.slice(0, 8),
          when(item.startsAt),
          <StatusBadge key="status" status={item.status} />,
        ])}
      />
    </>
  );
}
