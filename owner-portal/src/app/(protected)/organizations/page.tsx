import Link from "next/link";
import { PageHeader, StateView, StatusBadge } from "@/components/app-shell";
import { listOrganizations } from "@/data/owner-data";
import { requireOwnerSession } from "@/infrastructure/auth";
export default async function OrganizationsPage() {
  const data = await listOrganizations(await requireOwnerSession());
  return (
    <>
      <PageHeader
        title="Organizations"
        description="Manage the healthcare organizations operating on Saxlem."
        action={
          <Link className="button button-primary" href="/organizations/new">
            Create organization
          </Link>
        }
      />
      {data.items.length ? (
        <div className="card table-card">
          <table className="table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Status</th>
                <th>Created</th>
                <th>Last updated</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    <br />
                    <small>{item.id}</small>
                  </td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                  <td>
                    {new Date(item.createdAt).toLocaleDateString("en-IQ")}
                  </td>
                  <td>
                    {new Date(item.updatedAt).toLocaleDateString("en-IQ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <StateView
          title="No organizations"
          description="Create the first organization to begin clinic onboarding."
        />
      )}
    </>
  );
}
