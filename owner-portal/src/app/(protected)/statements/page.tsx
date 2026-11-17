import Link from "next/link";
import { PageHeader, StateView } from "@/components/app-shell";
import { OrganizationFilter } from "@/components/organization-filter";
import {
  listBillingStatements,
  listOrganizations,
  type StatementSummary,
} from "@/data/owner-data";
import { iqd } from "@/domain/money";
import { requireOwnerSession } from "@/infrastructure/auth";
import { z } from "zod";

const period = (start: string, end: string) => {
  const format = (value: Date) =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Baghdad",
      day: "numeric",
      month: "short",
    }).format(value);
  return `${format(new Date(start))} – ${format(new Date(new Date(end).getTime() - 1))}`;
};

function Rows({ items }: { items: readonly StatementSummary[] }) {
  return (
    <div className="card table-card" tabIndex={0}>
      <table className="table">
        <thead>
          <tr>
            <th>Doctor</th>
            <th>Statement</th>
            <th>Period</th>
            <th>App payments</th>
            <th>Commission</th>
            <th>Result</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={`${item.doctorId}:${item.cycleNumber}`}>
              <td>
                <strong>{item.doctorName}</strong>
                <small>{item.organizationName}</small>
              </td>
              <td>
                {item.statementNumber}
                <small>Cycle {item.cycleNumber}</small>
              </td>
              <td>{period(item.periodStart, item.periodEnd)}</td>
              <td className="numeric">{iqd(item.grossCollectedIqd)}</td>
              <td className="numeric">{iqd(item.commissionIqd)}</td>
              <td className="numeric">
                <span
                  className={
                    item.direction === "saxlemPays"
                      ? "direction-pays"
                      : item.direction === "doctorPays"
                        ? "direction-owes"
                        : undefined
                  }
                >
                  {iqd(Math.abs(item.netPayableIqd))}
                </span>
                <small>
                  {item.direction === "saxlemPays"
                    ? "Saxlem pays doctor"
                    : item.direction === "doctorPays"
                      ? "Doctor pays Saxlem (cash)"
                      : "Even"}
                  {item.settlement &&
                    ` · ${item.settlement.method === "cash" ? "cash" : "FIB"}`}
                </small>
              </td>
              <td>
                <Link
                  className="button button-secondary button-small"
                  href={`/statements/${item.organizationId}/${item.doctorId}/${item.cycleNumber}`}
                >
                  {item.canSettle ? "Settle" : "Open"}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function StatementsPage({
  searchParams,
}: {
  searchParams: Promise<{ organizationId?: string }>;
}) {
  const session = await requireOwnerSession();
  const { organizationId } = await searchParams;
  const valid = z.string().uuid().safeParse(organizationId);
  const [organizations, data] = await Promise.all([
    listOrganizations(session),
    listBillingStatements(session, valid.success ? valid.data : undefined),
  ]);
  const group = (status: StatementSummary["status"]) =>
    data.items.filter((item) => item.status === status);
  const due = group("due"),
    waiting = group("waiting"),
    // Running statements with nothing in them yet are noise.
    open = group("open").filter(
      (item) =>
        item.paymentCount > 0 ||
        item.commissionIqd !== 0 ||
        (item.chargeCount ?? 0) > 0,
    ),
    settled = group("settled");
  const toCollect = due
    .filter((item) => item.netPayableIqd < 0)
    .reduce((sum, item) => sum - item.netPayableIqd, 0);
  const toPay = due
    .filter((item) => item.netPayableIqd > 0)
    .reduce((sum, item) => sum + item.netPayableIqd, 0);
  return (
    <>
      <PageHeader
        title="Statements"
        description="Every doctor gets a statement every 30 days, counted from the day their clinic was listed in the app. Doctors pay Saxlem in cash; Saxlem pays doctors by FIB or cash."
      />
      <OrganizationFilter
        organizations={organizations.items}
        selected={valid.success ? valid.data : undefined}
        action="/statements"
        allowAll
      />
      <section className="grid metrics">
        <article className="card metric">
          <span>Ready to settle</span>
          <strong>{due.length}</strong>
        </article>
        <article className="card metric">
          <span>To collect in cash</span>
          <strong>{iqd(toCollect)}</strong>
        </article>
        <article className="card metric">
          <span>To pay doctors</span>
          <strong>{iqd(toPay)}</strong>
        </article>
        <article className="card metric">
          <span>Running now</span>
          <strong>{open.length}</strong>
        </article>
      </section>
      <div className="statement-groups">
        <section>
          <h2>Ready to settle</h2>
          {due.length ? (
            <Rows items={due} />
          ) : (
            <StateView
              title="Nothing to settle"
              description="Statements appear here when their 30 days end."
            />
          )}
        </section>
        {waiting.length > 0 && (
          <section>
            <h2>Waiting for an older statement</h2>
            <Rows items={waiting} />
          </section>
        )}
        <section>
          <h2>Running now</h2>
          {open.length ? (
            <Rows items={open} />
          ) : (
            <p className="muted">No activity in the current 30 days yet.</p>
          )}
        </section>
        {settled.length > 0 && (
          <section>
            <h2>Settled</h2>
            <Rows items={settled.slice(0, 50)} />
          </section>
        )}
      </div>
    </>
  );
}
