import { PageHeader } from "@/components/app-shell";
import { PlatformCreateForm } from "@/components/platform-create-form";
import {
  listClinics,
  listOrganizations,
  listPlatformSpecialties,
} from "@/data/owner-data";
import { requireOwnerSession } from "@/infrastructure/auth";
export default async function NewDoctorPage() {
  const session = await requireOwnerSession();
  const [organizations, clinics, specialties] = await Promise.all([
    listOrganizations(session),
    listClinics(session),
    listPlatformSpecialties(session),
  ]);
  return (
    <>
      <PageHeader
        title="Onboard doctor"
        description="Add the doctor, their clinic and specialty in one step."
      />
      <PlatformCreateForm
        kind="doctor"
        organizations={organizations.items}
        clinics={clinics.items}
        specialties={specialties.map((item) => ({
          id: item.id,
          name: item.displayName,
        }))}
      />
    </>
  );
}
