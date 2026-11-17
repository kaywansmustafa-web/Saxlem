import { BrandMark } from "@/components/brand-mark";
import type { StatementDocument as Statement } from "@/data/owner-data";

const iqd = (value: number) =>
  `${(value === 0 ? 0 : value).toLocaleString("en-IQ")} IQD`;
const day = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Baghdad",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
const dayTime = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Baghdad",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
/** The period ends at midnight; the last day shown is the day before. */
const lastDay = (end: string) =>
  day(new Date(new Date(end).getTime() - 1).toISOString());

const statusText: Record<Statement["status"], string> = {
  open: "Running — amounts can still change",
  due: "Ready to settle",
  waiting: "Waiting — an older statement is settled first",
  settled: "Settled",
};

/** The statement both sides keep: same layout on screen and on paper. */
export function StatementDocument({ statement }: { statement: Statement }) {
  const s = statement;
  const net = s.netPayableIqd;
  const verdict =
    net > 0
      ? `Saxlem pays ${s.doctorName}`
      : net < 0
        ? `${s.doctorName} pays Saxlem`
        : "Nothing owed either way";
  return (
    <article
      className="statement-sheet"
      aria-label={`Statement ${s.statementNumber}`}
    >
      <header className="statement-head">
        <div className="statement-brand">
          <BrandMark className="statement-mark" idPrefix="sx-statement" />
          <div>
            <strong className="statement-wordmark">saxlem</strong>
            <span>Healthcare booking · Kurdistan Region</span>
          </div>
        </div>
        <div className="statement-id">
          <h1>Statement</h1>
          <dl>
            <dt>Number</dt>
            <dd>{s.statementNumber}</dd>
            <dt>Period</dt>
            <dd>
              {day(s.periodStart)} – {lastDay(s.periodEnd)}
            </dd>
            <dt>Cycle</dt>
            <dd>
              {s.cycleNumber} (every 30 days from{" "}
              {day(`${s.cycleStart}T00:00:00+03:00`)})
            </dd>
            <dt>Issued</dt>
            <dd>{day(s.issuedAt)}</dd>
            <dt>Status</dt>
            <dd>{statusText[s.status]}</dd>
          </dl>
        </div>
      </header>

      <section className="statement-parties">
        <div>
          <span className="statement-label">From</span>
          <strong>Saxlem</strong>
          <span>Duhok, Kurdistan Region of Iraq</span>
        </div>
        <div>
          <span className="statement-label">To</span>
          <strong>{s.doctorName}</strong>
          <span>{s.organizationName}</span>
          {s.clinicNames.length > 0 && <span>{s.clinicNames.join(", ")}</span>}
        </div>
      </section>

      <section
        className={`statement-total ${net > 0 ? "pays" : net < 0 ? "owes" : "even"}`}
      >
        <span>{verdict}</span>
        <strong>{iqd(Math.abs(net))}</strong>
        <small>
          {net < 0
            ? s.dueAt
              ? `Paid in cash, in person, by ${day(s.dueAt)}.`
              : "Paid in cash, in person."
            : net > 0
              ? s.payoutAccount
                ? `By FIB to ${s.payoutAccount.name ?? "account"} ${s.payoutAccount.numberHint}, or in cash.`
                : "By FIB transfer or in cash."
              : "This statement closes with no payment."}
        </small>
      </section>

      <section className="statement-section">
        <h2>How it adds up</h2>
        <table className="statement-table sums">
          <tbody>
            <tr>
              <td>Paid by patients in the app ({s.paymentCount})</td>
              <td>{iqd(s.grossCollectedIqd)}</td>
            </tr>
            {s.clawbackIqd > 0 && (
              <tr>
                <td>Refunds of earlier payouts, taken back</td>
                <td>−{iqd(s.clawbackIqd)}</td>
              </tr>
            )}
            {s.providerFeeIqd > 0 && (
              <tr>
                <td>FIB fee ({s.providerFeeBps / 100}%)</td>
                <td>−{iqd(s.providerFeeIqd)}</td>
              </tr>
            )}
            <tr>
              <td>
                Saxlem commission (
                {s.charges.filter((c) => c.kind === "charge").length} app
                bookings)
              </td>
              <td>
                {s.commissionIqd ? "−" : ""}
                {iqd(s.commissionIqd)}
              </td>
            </tr>
            {s.carriedFrom.map((row) => (
              <tr key={row.cycleNumber}>
                <td>Unpaid from statement {row.statementNumber}</td>
                <td>−{iqd(-row.amountIqd)}</td>
              </tr>
            ))}
            <tr className="sum-total">
              <td>{verdict}</td>
              <td>{iqd(Math.abs(net))}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="statement-section statement-facts">
        <div>
          <h2>Visits</h2>
          <dl>
            <dt>Completed</dt>
            <dd>{s.visits.completed}</dd>
            <dt>No-shows</dt>
            <dd>{s.visits.noShow}</dd>
            <dt>Cancelled</dt>
            <dd>{s.visits.cancelled}</dd>
            {s.visits.upcoming > 0 && (
              <>
                <dt>Still to come</dt>
                <dd>{s.visits.upcoming}</dd>
              </>
            )}
            <dt>Booked in the app</dt>
            <dd>{s.visits.app}</dd>
            <dt>By phone</dt>
            <dd>{s.visits.phone}</dd>
            <dt>Walk-ins</dt>
            <dd>{s.visits.walkIn}</dd>
          </dl>
        </div>
        <div>
          <h2>Revenue recorded</h2>
          <dl>
            <dt>At the counter ({s.revenue.counterCount})</dt>
            <dd>{iqd(s.revenue.counterIqd)}</dd>
            <dt>In the app ({s.revenue.onlineCount})</dt>
            <dd>{iqd(s.revenue.onlineIqd)}</dd>
            <dt className="strong">Total</dt>
            <dd className="strong">{iqd(s.revenue.totalIqd)}</dd>
          </dl>
          <p className="statement-note">
            Counter money stays with the clinic. Only app bookings carry a
            commission.
          </p>
        </div>
      </section>

      <section className="statement-section">
        <h2>Commission on app bookings</h2>
        {s.charges.length ? (
          <table className="statement-table">
            <thead>
              <tr>
                <th>Visit</th>
                <th>Booking</th>
                <th>Plan</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {s.charges.map((line) => (
                <tr
                  key={line.id}
                  className={line.kind === "credit" ? "credit" : undefined}
                >
                  <td>{dayTime(line.appointmentStartsAt)}</td>
                  <td>
                    {line.appointmentReference}
                    {line.kind === "credit" && (
                      <small>Credit: {line.reason}</small>
                    )}
                  </td>
                  <td>{line.planName}</td>
                  <td>
                    {line.amountIqd < 0
                      ? `−${iqd(-line.amountIqd)}`
                      : iqd(line.amountIqd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="statement-empty">No commission this period.</p>
        )}
      </section>

      <section className="statement-section">
        <h2>Paid by patients in the app</h2>
        {s.onlinePayments.length ? (
          <table className="statement-table">
            <thead>
              <tr>
                <th>Paid</th>
                <th>Booking</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {s.onlinePayments.map((line) => (
                <tr key={line.id}>
                  <td>{dayTime(line.at)}</td>
                  <td>{line.appointmentReference}</td>
                  <td>{iqd(line.amountIqd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="statement-empty">No app payments this period.</p>
        )}
        {s.refunds.length > 0 && (
          <>
            <h3>Refunds taken back</h3>
            <table className="statement-table">
              <tbody>
                {s.refunds.map((line) => (
                  <tr key={line.id}>
                    <td>{dayTime(line.at)}</td>
                    <td>{line.appointmentReference}</td>
                    <td>−{iqd(line.amountIqd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>

      <section className="statement-section statement-settlement">
        <h2>Settlement</h2>
        {s.settlement?.method === "carried" ? (
          <p className="statement-empty">
            Not paid by the due date. The balance moved into statement{" "}
            {s.settlement.carriedIntoStatement} and comes out of the
            doctor&apos;s app payments there.
          </p>
        ) : s.settlement ? (
          <dl>
            <dt>Paid</dt>
            <dd>
              {dayTime(s.settlement.settledAt)} ·{" "}
              {s.settlement.method === "cash" ? "Cash" : "FIB transfer"}
            </dd>
            {s.settlement.reference && (
              <>
                <dt>
                  {s.settlement.method === "cash" ? "Receipt" : "Reference"}
                </dt>
                <dd>{s.settlement.reference}</dd>
              </>
            )}
            {s.settlement.counterpartyName && (
              <>
                <dt>{net < 0 ? "Paid by" : "Received by"}</dt>
                <dd>{s.settlement.counterpartyName}</dd>
              </>
            )}
            {s.settlement.settledByName && (
              <>
                <dt>Recorded by</dt>
                <dd>{s.settlement.settledByName}</dd>
              </>
            )}
            {s.settlement.note && (
              <>
                <dt>Note</dt>
                <dd>{s.settlement.note}</dd>
              </>
            )}
          </dl>
        ) : (
          <p className="statement-empty">
            {s.status === "open"
              ? `Not settled yet. This period ends on ${lastDay(s.periodEnd)}.`
              : "Not settled yet."}
          </p>
        )}
        <div className="statement-signatures">
          <div>
            <span />
            For Saxlem
          </div>
          <div>
            <span />
            {s.doctorName} or clinic
          </div>
        </div>
      </section>

      <footer className="statement-foot">
        Saxlem · {s.statementNumber} · Amounts in Iraqi dinars (IQD). Times are
        Baghdad time.
      </footer>
    </article>
  );
}
