import { CreateForm } from "@/components/create-form";
import { PageHeader } from "@/components/app-shell";
import { listOrganizations } from "@/data/owner-data";
import { requireOwnerSession } from "@/infrastructure/auth";
export default async function NewClinicPage() {
  const organizations = (
    await listOrganizations(await requireOwnerSession())
  ).items.filter((item) => item.status === "active");
  return (
    <>
      <PageHeader
        title="Create Clinic"
        description="Create an active clinic under an active organization."
      />
      <CreateForm kind="clinic" organizations={organizations} />
    </>
  );
}
