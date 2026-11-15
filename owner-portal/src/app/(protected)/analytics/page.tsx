import { PageHeader } from "@/components/app-shell";
import { executiveAnalytics } from "@/data/owner-data";
import { requireOwnerSession } from "@/infrastructure/auth";
export default async function AnalyticsPage() {
  const data = await executiveAnalytics(await requireOwnerSession());
  return (
    <>
      <PageHeader
        title="Analytics"
        description="Bounded authoritative platform and financial metrics."
      />
      <section className="grid metrics" aria-label="Executive metrics">
        {Object.entries(data.totals).map(([key, value]) => (
          <article className="card metric" key={key}>
            <span>{key.replace(/([A-Z])/g, " $1")}</span>
            <strong>{value.toLocaleString("en-IQ")}</strong>
          </article>
        ))}
      </section>
      <div className="grid split section">
        <Trend title="Appointments by day" items={data.appointmentTrend} />
        <Trend title="Patient growth" items={data.patientGrowth} />
        <Trend title="Commission by day" items={data.commissionTrend} />
      </div>
    </>
  );
}
function Trend({
  title,
  items,
}: {
  title: string;
  items: Record<string, unknown>[];
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
              <span>{String(item.day)}</span>
              <i
                style={{
                  width: `${Math.max(2, (Number(item.count ?? item.amountIqd ?? 0) / max) * 100)}%`,
                }}
              />
              <strong>
                {Number(item.count ?? item.amountIqd ?? 0).toLocaleString(
                  "en-IQ",
                )}
              </strong>
            </div>
          ))}
        </div>
      ) : (
        <p>No activity in this period.</p>
      )}
    </section>
  );
}
