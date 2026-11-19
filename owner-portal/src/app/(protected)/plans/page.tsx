import { PageHeader, StateView, StatusBadge } from "@/components/app-shell";
import { CreatePlanForm, PlanStatusButton } from "@/components/billing-forms";
import { listPlans } from "@/data/owner-data";
import { requireOwnerSession } from "@/infrastructure/auth";

export default async function PlansPage() {
  const data = await listPlans(await requireOwnerSession());
  return (
    <>
      <PageHeader
        title="Commission plans"
        description="What Saxlem charges per completed first visit booked in the app. Give a clinic or a single doctor a plan under Billing."
      />
      <CreatePlanForm />
      {data.length ? (
        <div className="card table-card" style={{ marginTop: 18 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Charge per visit</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.displayName}</strong>
                    <small>{item.code}</small>
                  </td>
                  <td className="numeric">
                    {item.commissionAmountIqd === 0
                      ? "Free"
                      : `${item.commissionAmountIqd.toLocaleString("en-IQ")} IQD`}
                  </td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                  <td>
                    <PlanStatusButton planId={item.id} status={item.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <StateView
          title="No plans"
          description="Create the first plan above."
        />
      )}
    </>
  );
}
