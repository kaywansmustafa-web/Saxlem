import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeader, StatusBadge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { StaffControls } from "@/components/staff-controls";
import { listClinics, listOrganizations, staffDetail } from "@/data/owner-data";
import { requireOwnerSession } from "@/infrastructure/auth";

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const session = await requireOwnerSession();
  const [staff, organizations, clinics] = await Promise.all([
    staffDetail(session, id),
    listOrganizations(session),
    listClinics(session),
  ]);
  return (
    <>
      <PageHeader
        title={staff.email}
        description="Safe staff account, assignments, and clinic memberships."
      />
      <div className="grid split">
        <section className="card detail-card">
          <h2>Account</h2>
          <p>
            <StatusBadge status={staff.status} />
          </p>
          <p>User {staff.userId}</p>
          {staff.doctorName && <p>Doctor identity: {staff.doctorName}</p>}
        </section>
        <StaffControls
          staffId={staff.staffAccountId}
          status={staff.status}
          memberships={staff.memberships}
          organizations={organizations.items}
          clinics={clinics.items}
        />
      </div>
      <h2>Memberships</h2>
      <DataTable
        headers={["Organization", "Clinic", "Role", "Status"]}
        rows={staff.memberships.map((item) => [
          item.organizationName,
          item.clinicName,
          item.role,
          <StatusBadge key="status" status={item.status} />,
        ])}
      />
    </>
  );
}
