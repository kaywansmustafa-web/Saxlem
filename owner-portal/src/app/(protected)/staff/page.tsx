import { humanize } from "@/domain/labels";
import Link from "next/link";
import { PageHeader, StateView, StatusBadge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { listStaff } from "@/data/owner-data";
import { requireOwnerSession } from "@/infrastructure/auth";
export default async function StaffPage() {
  const data = await listStaff(await requireOwnerSession());
  return (
    <>
      <PageHeader
        title="Staff"
        description="Everyone who works on Saxlem, their role and where they work."
        action={
          <Link className="button button-primary" href="/staff/new">
            Create staff member
          </Link>
        }
      />
      {data.items.length ? (
        <DataTable
          headers={["Account", "Roles", "Memberships", "Status"]}
          rows={data.items.map((item) => [
            <Link key="account" href={`/staff/${item.staffAccountId}`}>
              {item.email}
            </Link>,
            item.roles.map((role) => humanize(role.role)).join(", "),
            item.memberships
              .map((membership) => membership.clinicName)
              .join(", ") || "Global",
            <StatusBadge key="status" status={item.status} />,
          ])}
        />
      ) : (
        <StateView
          title="No staff accounts"
          description="No staff members yet."
        />
      )}
    </>
  );
}
