import { PageHeader } from "@/components/app-shell";
import { PlatformCreateForm } from "@/components/platform-create-form";
import { listClinics, listOrganizations } from "@/data/owner-data";
import { requireOwnerSession } from "@/infrastructure/auth";
export default async function NewStaffPage() {
  const session = await requireOwnerSession();
  const [organizations, clinics] = await Promise.all([
    listOrganizations(session),
    listClinics(session),
  ]);
  return (
    <>
      <PageHeader
        title="Create staff member"
        description="They get an invitation to set their own password. No default password is ever created."
      />
      <PlatformCreateForm
        kind="staff"
        organizations={organizations.items}
        clinics={clinics.items}
      />
    </>
  );
}
