import { PageHeader, StateView, StatusBadge } from "@/components/app-shell";
import { listPlans } from "@/data/owner-data";
import { requireOwnerSession } from "@/infrastructure/auth";
export default async function PlansPage() {
  const data = await listPlans(await requireOwnerSession());
  return (
    <>
      <PageHeader
        title="Billing Plans"
        description="Effective billing rules and immutable commission policy versions."
      />
      {data.length ? (
        <div className="card table-card">
          <table className="table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Code</th>
                <th>Commission</th>
                <th>Rule</th>
                <th>Version</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.displayName}</strong>
                  </td>
                  <td>{item.code}</td>
                  <td>
                    {item.commissionAmountIqd.toLocaleString("en-IQ")} IQD
                  </td>
                  <td>
                    {item.ruleCode} v{item.ruleVersion}
                  </td>
                  <td>{item.version}</td>
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
          title="No billing plans"
          description="No authoritative billing plan records are available."
        />
      )}
    </>
  );
}
