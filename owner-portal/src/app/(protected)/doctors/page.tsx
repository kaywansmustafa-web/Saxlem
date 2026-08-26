import { PageHeader, StateView, StatusBadge } from "@/components/app-shell";
import { listDoctors } from "@/data/owner-data";
import { requireOwnerSession } from "@/infrastructure/auth";
export default async function DoctorsPage() {
  const data = await listDoctors(await requireOwnerSession());
  return (
    <>
      <PageHeader
        title="Doctors"
        description="Global professional directory using authoritative doctor profiles and clinic assignments."
      />
      {data.items.length ? (
        <div className="card table-card">
          <table className="table">
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Specialty</th>
                <th>Clinics</th>
                <th>Experience</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.displayName}</strong>
                    <br />
                    <small>{item.languages.join(", ")}</small>
                  </td>
                  <td>{item.specialty}</td>
                  <td>
                    {item.clinics.map((c) => c.name).join(", ") || "Unassigned"}
                  </td>
                  <td>{item.yearsOfExperience} years</td>
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
          title="No doctors"
          description="No doctor profiles match the current authoritative directory query."
        />
      )}
    </>
  );
}
