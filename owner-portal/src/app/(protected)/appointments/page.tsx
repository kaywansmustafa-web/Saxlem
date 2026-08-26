import { PageHeader, StateView, StatusBadge } from "@/components/app-shell";
import { listAppointments } from "@/data/owner-data";
import { requireOwnerSession } from "@/infrastructure/auth";
export default async function AppointmentsPage() {
  const now = new Date(),
    from = new Date(now.getTime() - 7 * 86400000).toISOString(),
    to = new Date(now.getTime() + 31 * 86400000).toISOString();
  const data = await listAppointments(await requireOwnerSession(), from, to);
  return (
    <>
      <PageHeader
        title="Appointments"
        description="Global administrative oversight without unsafe lifecycle overrides."
      />
      {data.items.length ? (
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
              {data.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.reference}</td>
                  <td>
                    {new Date(item.startsAt).toLocaleString("en-IQ", {
                      timeZone: "Asia/Baghdad",
                    })}
                  </td>
                  <td>{item.patientName}</td>
                  <td>{item.doctorName}</td>
                  <td>{item.clinicName}</td>
                  <td>{item.type}</td>
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
