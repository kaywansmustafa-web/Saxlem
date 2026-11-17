import { PageHeader, StateView, StatusBadge } from "@/components/app-shell";
import { CreditButton } from "@/components/billing-forms";
import { OrganizationFilter } from "@/components/organization-filter";
import { listOrganizations, listCommissions } from "@/data/owner-data";
import { requireOwnerSession } from "@/infrastructure/auth";
import { z } from "zod";

export default async function CommissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ organizationId?: string }>;
}) {
  const session = await requireOwnerSession(),
    organizations = (await listOrganizations(session)).items,
    { organizationId } = await searchParams,
    valid = z.string().uuid().safeParse(organizationId),
    data = valid.success ? await listCommissions(session, valid.data) : null;
  const credited = new Set(
    data?.items
      .map((item) => item.originalCommissionId)
      .filter((value): value is string => Boolean(value)),
  );
  return (
    <>
      <PageHeader
        title="Commissions"
        description="Every charge on a completed app booking, and every credit. Credit a charge while its statement is still open."
      />
      <OrganizationFilter
        organizations={organizations}
        selected={valid.success ? valid.data : undefined}
        action="/commissions"
      />
      {data ? (
        data.items.length ? (
          <div className="card table-card">
            <table className="table">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Booking</th>
                  <th>Completed</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.doctorName}</td>
                    <td>
                      {item.appointmentReference}
                      {item.reason && <small>Credit: {item.reason}</small>}
                    </td>
                    <td>
                      {new Date(item.completedAt).toLocaleDateString("en-GB", {
                        timeZone: "Asia/Baghdad",
                      })}
                    </td>
                    <td className="numeric">
                      {item.status === "reversed" ? "−" : ""}
                      {item.amountIqd.toLocaleString("en-IQ")} IQD
                    </td>
                    <td>
                      <StatusBadge
                        status={
                          item.status === "reversed"
                            ? "credited"
                            : credited.has(item.id)
                              ? "waived"
                              : "earned"
                        }
                      />
                    </td>
                    <td>
                      {item.status === "earned" && !credited.has(item.id) && (
                        <CreditButton
                          commissionId={item.id}
                          reference={item.appointmentReference}
                          amountIqd={item.amountIqd}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <StateView
            title="No charges yet"
            description="Charges appear when app bookings are completed."
          />
        )
      ) : (
        <StateView
          title="Choose an organization"
          description="Pick an organization above to see its commissions."
        />
      )}
    </>
  );
}
