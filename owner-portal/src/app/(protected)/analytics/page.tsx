import { day } from "@/domain/format";
import { PageHeader } from "@/components/app-shell";
import { executiveAnalytics } from "@/data/owner-data";
import { requireOwnerSession } from "@/infrastructure/auth";

const metricLabels: Record<string, string> = {
  organizations: "Organizations",
  activeOrganizations: "Active organizations",
  clinics: "Clinics",
  activeClinics: "Active clinics",
  doctors: "Doctors",
  activeDoctors: "Active doctors",
  staff: "Staff accounts",
  patients: "Patient accounts",
  appointmentsToday: "Appointments today",
  appointmentsMonth: "Appointments this month",
  completedAppointments: "Completed appointments",
  cancelledAppointments: "Cancelled appointments",
  noShows: "No-shows",
  arrivals: "Arrivals",
  liveQueues: "Live queues",
  waitingPatients: "Patients waiting",
  grossCommissionIqd: "Gross commission",
  reversalsIqd: "Reversals",
  netCommissionIqd: "Net commission",
  draftStatements: "Draft statements",
  finalizedStatements: "Finalized statements",
};
const label = (key: string) =>
  metricLabels[key] ??
  key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
const formatMetric = (key: string, value: number) =>
  `${value.toLocaleString("en-IQ")}${key.endsWith("Iqd") ? " IQD" : ""}`;
const formatDay = (value: unknown) => day(`${String(value)}T12:00:00Z`);
export default async function AnalyticsPage() {
  const data = await executiveAnalytics(await requireOwnerSession());
  return (
    <>
      <PageHeader
        title="Analytics"
        description="Growth, bookings and revenue across the platform."
      />
      <section className="grid metrics" aria-label="Executive metrics">
        {Object.entries(data.totals)
          // Monthly organization statements were replaced by 30-day doctor statements.
          .filter(([key]) => key !== "draftStatements" && key !== "finalizedStatements")
          .map(([key, value]) => (
          <article className="card metric" key={key}>
            <span>{label(key)}</span>
            <strong>{formatMetric(key, value)}</strong>
          </article>
        ))}
      </section>
      <div className="grid split section">
        <Trend title="Appointments by day" items={data.appointmentTrend} />
        <Trend title="Patient growth" items={data.patientGrowth} />
        <Trend
          title="Commission by day"
          items={data.commissionTrend}
          unit="IQD"
        />
      </div>
    </>
  );
}
function Trend({
  title,
  items,
  unit,
}: {
  title: string;
  items: Record<string, unknown>[];
  unit?: string;
}) {
  const max = Math.max(
    1,
    ...items.map((item) => Number(item.count ?? item.amountIqd ?? 0)),
  );
  return (
    <section className="card chart">
      <h2>{title}</h2>
      {items.length ? (
        <div className="bars">
          {items.map((item, index) => (
            <div key={index} className="bar-row">
              <span>{formatDay(item.day)}</span>
              <i
                style={{
                  width: `${Math.max(2, (Number(item.count ?? item.amountIqd ?? 0) / max) * 100)}%`,
                }}
              />
              <strong>
                {Number(item.count ?? item.amountIqd ?? 0).toLocaleString(
                  "en-IQ",
                )}
                {unit ? ` ${unit}` : ""}
              </strong>
            </div>
          ))}
        </div>
      ) : (
        <p className="chart-empty">No activity in this period.</p>
      )}
    </section>
  );
}
