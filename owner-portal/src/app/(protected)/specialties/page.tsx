import { PageHeader, StateView } from "@/components/app-shell";
import { SpecialtiesManager } from "@/components/app-config/specialties-manager";
import { listCatalogSpecialties } from "@/data/app-catalog";
import { requireOwnerSession } from "@/infrastructure/auth";

export default async function SpecialtiesPage() {
  const specialties = await listCatalogSpecialties(await requireOwnerSession());
  return (
    <>
      <PageHeader
        title="Specialties"
        description="What doctors practise. Patients search by specialty, Home shows them in this order, and Home tiles open the doctors of the specialties you link. Give each one its Arabic and Kurdish name here."
      />
      {specialties.length ? (
        <SpecialtiesManager specialties={specialties} />
      ) : (
        <>
          <SpecialtiesManager specialties={[]} />
          <StateView title="No specialties yet" description="Add the first one, then give doctors their specialties on each doctor's page." />
        </>
      )}
    </>
  );
}
