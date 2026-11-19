import { PageHeader, StateView, StatusBadge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { listLiveOperations } from "@/data/owner-data";
import { requireOwnerSession } from "@/infrastructure/auth";
export default async function LiveOperationsPage() {
  const items = await listLiveOperations(await requireOwnerSession());
  return (
    <>
      <PageHeader
        title="Live Operations"
        description="Queues running right now. Patients are shown by initials only."
      />
      {items.length ? (
        <DataTable
          headers={[
            "Clinic",
            "Doctor",
            "Queue",
            "Waiting",
            "Current",
            "Operational delay",
          ]}
          rows={items.map((item) => [
            item.clinicName,
            item.doctorName,
            <StatusBadge key="status" status={item.health} />,
            String(item.waitingCount),
            item.currentPatientInitials ?? "No consultation",
            item.estimatedDelayMinutes === null
              ? "Suspended"
              : `${item.estimatedDelayMinutes} min`,
          ])}
        />
      ) : (
        <StateView
          title="No active queues"
          description="No clinic has an open queue right now."
        />
      )}
    </>
  );
}
