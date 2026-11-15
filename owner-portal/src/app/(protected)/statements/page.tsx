import { PageHeader, StateView, StatusBadge } from "@/components/app-shell";
import { OrganizationFilter } from "@/components/organization-filter";
import { listOrganizations, listStatements } from "@/data/owner-data";
import { requireOwnerSession } from "@/infrastructure/auth";
import { z } from "zod";
import { FinalizeStatement } from "@/components/finalize-statement";
export default async function StatementsPage({
  searchParams,
}: {
  searchParams: Promise<{ organizationId?: string }>;
}) {
  const session = await requireOwnerSession(),
    organizations = (await listOrganizations(session)).items,
    { organizationId } = await searchParams,
    valid = z.string().uuid().safeParse(organizationId),
    data = valid.success ? await listStatements(session, valid.data) : null;
  return (
    <>
      <PageHeader
        title="Statements"
        description="Draft and immutable finalized organization statements in Asia/Baghdad periods."
      />
      <OrganizationFilter
        organizations={organizations}
        selected={valid.success ? valid.data : undefined}
        action="/statements"
      />
      {data ? (
        data.length ? (
          <div className="card table-card">
            <table className="table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Qualifying</th>
                  <th>Gross</th>
                  <th>Reversals</th>
                  <th>Net</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {new Date(item.periodStart).toLocaleDateString("en-IQ")} –{" "}
                      {new Date(item.periodEnd).toLocaleDateString("en-IQ")}
                    </td>
                    <td>{item.qualifyingCount}</td>
                    <td>{item.grossEarnedIqd.toLocaleString("en-IQ")} IQD</td>
                    <td>{item.reversalsIqd.toLocaleString("en-IQ")} IQD</td>
                    <td>{item.netCommissionIqd.toLocaleString("en-IQ")} IQD</td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>
                      {item.status === "draft" ? (
                        <FinalizeStatement statement={item} />
                      ) : (
                        "Immutable"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <StateView
            title="No statements"
            description="No draft or finalized statements were returned for this organization."
          />
        )
      ) : (
        <StateView
          title="Choose an organization"
          description="Select an organization to retrieve its authoritative statements."
        />
      )}
    </>
  );
}
