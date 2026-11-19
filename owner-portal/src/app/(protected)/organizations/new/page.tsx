import { CreateForm } from "@/components/create-form";
import { PageHeader } from "@/components/app-shell";
export default function NewOrganizationPage() {
  return (
    <>
      <PageHeader
        title="Create Organization"
        description="An organization is the company or group that owns one or more clinics."
      />
      <CreateForm kind="organization" />
    </>
  );
}
