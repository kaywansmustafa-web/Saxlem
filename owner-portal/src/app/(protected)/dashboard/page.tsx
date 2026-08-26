import Link from "next/link";
import { PageHeader, StateView, StatusBadge } from "@/components/app-shell";
import {
  listAppointments,
  listClinics,
  listDoctors,
  listOrganizations,
  listPlans,
  safeWindow,
} from "@/data/owner-data";
import { requireOwnerSession } from "@/infrastructure/auth";

export default async function DashboardPage() {
  const session = await requireOwnerSession();
  const window = safeWindow();
  const [organizations, clinics, doctors, appointments, plans] =
    await Promise.allSettled([
      listOrganizations(session),
      listClinics(session),
      listDoctors(session),
      listAppointments(session, window.from, window.to),
      listPlans(session),
    ]);
  const orgs =
    organizations.status === "fulfilled" ? organizations.value.items : [];
  const clinicItems = clinics.status === "fulfilled" ? clinics.value.items : [];
  const doctorResult = doctors.status === "fulfilled" ? doctors.value : null;
  const appointmentItems =
    appointments.status === "fulfilled" ? appointments.value.items : [];
  const planItems = plans.status === "fulfilled" ? plans.value : [];
  const unavailable = [
    organizations,
    clinics,
    doctors,
    appointments,
    plans,
  ].filter((item) => item.status === "rejected").length;
  return (
    <>
      <PageHeader
        title="Executive Dashboard"
        description="Authoritative platform activity and administration at a glance."
        action={
          <Link className="button button-primary" href="/organizations/new">
            Create organization
          </Link>
        }
      />
      {unavailable > 0 && (
        <p className="card" role="status" style={{ padding: 14 }}>
          Some metrics are temporarily unavailable. Available sections remain
          current.
        </p>
      )}
      <section className="grid metrics" aria-label="Platform metrics">
        <article className="card metric">
          <span>Organizations loaded</span>
          <strong>{orgs.length}</strong>
        </article>
        <article className="card metric">
          <span>Clinics loaded</span>
          <strong>{clinicItems.length}</strong>
        </article>
        <article className="card metric">
          <span>Active doctors</span>
          <strong>{doctorResult?.total ?? "—"}</strong>
        </article>
        <article className="card metric">
          <span>Appointments today</span>
          <strong>
            {appointments.status === "fulfilled"
              ? appointmentItems.length
              : "—"}
          </strong>
        </article>
      </section>
      <section className="section">
        <div className="section-title">
          <h2>Appointments today</h2>
          <Link href="/appointments">View all</Link>
        </div>
        {appointmentItems.length ? (
          <div className="card table-card">
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Clinic</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {appointmentItems.slice(0, 8).map((item) => (
                  <tr key={item.id}>
                    <td>
                      {new Date(item.startsAt).toLocaleTimeString("en-IQ", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Asia/Baghdad",
                      })}
                    </td>
                    <td>{item.patientName}</td>
                    <td>{item.doctorName}</td>
                    <td>{item.clinicName}</td>
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
            title="No appointments in the loaded window"
            description="No appointment records were returned for today."
          />
        )}
      </section>
      <section className="grid split section">
        <div>
          <div className="section-title">
            <h2>Recently onboarded clinics</h2>
            <Link href="/clinics">View clinics</Link>
          </div>
          <ul className="card list">
            {clinicItems.slice(0, 6).map((item) => (
              <li key={item.id}>
                <strong>{item.name}</strong>
                <br />
                <small>
                  {item.code} · {item.timezone}
                </small>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="section-title">
            <h2>Billing plans</h2>
            <Link href="/plans">View plans</Link>
          </div>
          <ul className="card list">
            {planItems.map((item) => (
              <li key={item.id}>
                <strong>{item.displayName}</strong>
                <br />
                <small>
                  {item.commissionAmountIqd.toLocaleString("en-IQ")} IQD ·{" "}
                  {item.status}
                </small>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
