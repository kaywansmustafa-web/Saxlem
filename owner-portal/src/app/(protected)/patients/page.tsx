import { PageHeader, StateView, StatusBadge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { listPatients } from "@/data/owner-data";
import { requireOwnerSession } from "@/infrastructure/auth";
import Link from "next/link";
export default async function PatientsPage() {
  const data = await listPatients(await requireOwnerSession());
  return (
    <>
      <PageHeader
        title="Patients"
        description="Patient accounts, with phone numbers masked for privacy."
      />
      {data.items.length ? (
        <DataTable
          headers={["Patient", "Phone", "Profiles", "Appointments", "Status"]}
          rows={data.items.map((item) => [
            <Link key="patient" href={`/patients/${item.accountId}`}>
              {item.displayName}
            </Link>,
            item.maskedPhone,
            String(item.profileCount),
            String(item.appointmentCount),
            <StatusBadge key="status" status={item.status} />,
          ])}
        />
      ) : (
        <StateView
          title="No patient accounts"
          description="No administrative patient records match this scope."
        />
      )}
    </>
  );
}
