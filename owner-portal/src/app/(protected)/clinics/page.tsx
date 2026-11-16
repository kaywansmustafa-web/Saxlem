import Link from "next/link";
import { PageHeader, StateView, StatusBadge } from "@/components/app-shell";
import { listClinics, listOrganizations } from "@/data/owner-data";
import { requireOwnerSession } from "@/infrastructure/auth";
export default async function ClinicsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const session = await requireOwnerSession();
  const [data, organizations] = await Promise.all([
    listClinics(session),
    listOrganizations(session),
  ]);
  const organizationName = new Map(
    organizations.items.map((organization) => [
      organization.id,
      organization.name,
    ]),
  );
  const items = id ? data.items.filter((item) => item.id === id) : data.items;
  return (
    <>
      <PageHeader
        title="Clinics"
        description="Every clinic, who owns it and whether it is live."
        action={
          <Link className="button button-primary" href="/clinics/new">
            Create clinic
          </Link>
        }
      />
      {id && (
        <p className="filter-note">
          Showing one clinic from search.{" "}
          <Link href="/clinics">Show all clinics</Link>
        </p>
      )}
      {items.length ? (
        <div className="card table-card">
          <table className="table">
            <thead>
              <tr>
                <th>Clinic</th>
                <th>Code</th>
                <th>Organization</th>
                <th>Timezone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                  </td>
                  <td>{item.code}</td>
                  <td>
                    {organizationName.get(item.organizationId) ??
                      item.organizationId}
                  </td>
                  <td>{item.timezone}</td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <StateView
          title="No clinics"
          description="Create a clinic under an active organization."
        />
      )}
    </>
  );
}
