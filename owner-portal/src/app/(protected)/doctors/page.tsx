import { humanize } from "@/domain/labels";
import Link from "next/link";
import { PageHeader, StateView, StatusBadge } from "@/components/app-shell";
import { listDoctors } from "@/data/owner-data";
import { requireOwnerSession } from "@/infrastructure/auth";
export default async function DoctorsPage() {
  const data = await listDoctors(await requireOwnerSession());
  return (
    <>
      <PageHeader
        title="Doctors"
        description="Every doctor on Saxlem, their specialty and where they work."
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
                    <strong>
                      <Link href={`/doctors/${item.id}`}>
                        {item.displayName}
                      </Link>
                    </strong>
                    <br />
                    <small>{item.languages.map(humanize).join(" · ")}</small>
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
          description="Doctors appear here once they are onboarded with a specialty and a clinic."
        />
      )}
    </>
  );
}
