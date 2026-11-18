import { when } from "@/domain/format";
import { humanize } from "@/domain/labels";
import Link from "next/link";
import { PageHeader, StateView, StatusBadge } from "@/components/app-shell";
import { listAppointments } from "@/data/owner-data";
import { requireOwnerSession } from "@/infrastructure/auth";
export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const { reference } = await searchParams;
  const now = new Date(),
    from = new Date(now.getTime() - 7 * 86400000).toISOString(),
    to = new Date(now.getTime() + 31 * 86400000).toISOString();
  const data = await listAppointments(await requireOwnerSession(), from, to);
  const items = reference
    ? data.items.filter((item) => item.reference === reference)
    : data.items;
  return (
    <>
      <PageHeader
        title="Appointments"
        description="Every booking across all clinics."
      />
      {reference && (
        <p className="filter-note">
          Showing appointment {reference} from search (last 7 days to next 31
          days). <Link href="/appointments">Show all appointments</Link>
        </p>
      )}
      {items.length ? (
        <div className="card table-card">
          <table className="table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Date</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Clinic</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.reference}</td>
                  <td>
                    {when(item.startsAt)}
                  </td>
                  <td>{item.patientName}</td>
                  <td>{item.doctorName}</td>
                  <td>{item.clinicName}</td>
                  <td>{humanize(item.type)}</td>
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
          title="No appointments"
          description="No appointments were returned for the current monitoring window."
        />
      )}
    </>
  );
}
