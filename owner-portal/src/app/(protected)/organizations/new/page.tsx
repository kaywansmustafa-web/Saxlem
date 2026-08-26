import { CreateForm } from "@/components/create-form";
import { PageHeader } from "@/components/app-shell";
export default function NewOrganizationPage() {
  return (
    <>
      <PageHeader
        title="Create Organization"
        description="Create an active organization using the authoritative administration domain."
      />
      <CreateForm kind="organization" />
    </>
  );
}
