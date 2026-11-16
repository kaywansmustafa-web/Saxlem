import { humanize } from "@/domain/labels";
import { PageHeader, StateView, StatusBadge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { listAuditEvents } from "@/data/owner-data";
import { requireOwnerSession } from "@/infrastructure/auth";
export default async function AuditPage() {
  const data = await listAuditEvents(await requireOwnerSession());
  return (
    <>
      <PageHeader
        title="Audit Log"
        description="A permanent record of every sensitive action. Personal data is masked."
      />
      {data.items.length ? (
        <DataTable
          headers={["Time", "Action", "Record", "Result", "Request ID"]}
          rows={data.items.map((item) => [
            new Date(item.occurredAt).toLocaleString("en-IQ", {
              timeZone: "Asia/Baghdad",
            }),
            humanize(item.action),
            humanize(item.targetType),
            <StatusBadge key="status" status={item.outcome} />,
            item.requestId ?? "—",
          ])}
        />
      ) : (
        <StateView
          title="No audit events"
          description="No audit events match this scope."
        />
      )}
    </>
  );
}
