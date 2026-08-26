import Link from "next/link";
import { PageHeader, StateView, StatusBadge } from "@/components/app-shell";
import { listClinics } from "@/data/owner-data";
import { requireOwnerSession } from "@/infrastructure/auth";
export default async function ClinicsPage() {
  const data = await listClinics(await requireOwnerSession());
  return (
    <>
      <PageHeader
        title="Clinics"
        description="Review every clinic, its organization, timezone, and operational status."
        action={
          <Link className="button button-primary" href="/clinics/new">
            Create clinic
          </Link>
        }
      />
      {data.items.length ? (
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
              {data.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                  </td>
                  <td>{item.code}</td>
                  <td>{item.organizationId}</td>
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
