import { PageHeader } from "@/components/app-shell";
import { ConcernsManager } from "@/components/app-config/concerns-manager";
import { listCatalogConcerns, listCatalogSpecialties } from "@/data/app-catalog";
import { requireOwnerSession } from "@/infrastructure/auth";

export default async function HomeTilesPage() {
  const session = await requireOwnerSession();
  const [concerns, specialties] = await Promise.all([
    listCatalogConcerns(session),
    listCatalogSpecialties(session),
  ]);
  return (
    <>
      <PageHeader
        title="Home tiles"
        description={`"What's bothering you?" on Home. Each tile opens the doctors of every specialty you link to it. A tile only shows when at least one of its specialties has a doctor patients can book.`}
      />
      <ConcernsManager
        concerns={concerns}
        specialties={specialties.map((s) => ({
          id: s.id,
          nameEn: s.nameEn,
          activeDoctors: s.activeDoctors,
          status: s.status,
        }))}
      />
    </>
  );
}
