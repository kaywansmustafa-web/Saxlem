import { BrandMark } from "@/components/brand-mark";
import type { Locale } from "@/i18n";
import type { CycleStatementDocument } from "../domain/models";
import { statementFormat } from "./statement-format";
import { statementMessages } from "./statement-messages";

/** The statement the doctor and Saxlem both keep: same on screen and paper. */
export function StatementSheet({
  statement: s,
  locale,
}: {
  statement: CycleStatementDocument;
  locale: Locale;
}) {
  const m = statementMessages(locale);
  const f = statementFormat(locale, m.iqd);
  const net = s.netPayableIqd;
  const verdict =
    net > 0
      ? m.saxlemPays(s.doctorName)
      : net < 0
        ? m.doctorPays(s.doctorName)
        : m.even;
  const charges = s.charges.filter((line) => line.kind === "charge").length;
  return (
    <article
      className="statement-sheet"
      aria-label={`${m.statement} ${s.statementNumber}`}
    >
      <header className="statement-head">
        <div className="statement-brand">
          <BrandMark className="statement-mark" idPrefix="sx-statement" />
          <div>
            <strong className="statement-wordmark">saxlem</strong>
            <span>{m.tagline}</span>
          </div>
        </div>
        <div className="statement-id">
          <h1>{m.statement}</h1>
          <dl>
            <dt>{m.number}</dt>
            <dd dir="ltr">{s.statementNumber}</dd>
            <dt>{m.period}</dt>
            <dd>
              {f.day(s.periodStart)} – {f.lastDay(s.periodEnd)}
            </dd>
            <dt>{m.cycle}</dt>
            <dd>
              {m.cycleFrom(
                s.cycleNumber,
                f.day(`${s.cycleStart}T00:00:00+03:00`),
              )}
            </dd>
            <dt>{m.issued}</dt>
            <dd>{f.day(s.issuedAt)}</dd>
            <dt>{m.status}</dt>
            <dd>{m.statuses[s.status]}</dd>
          </dl>
        </div>
      </header>
      <section className="statement-parties">
        <div>
          <span className="statement-label">{m.from}</span>
          <strong>Saxlem</strong>
          <span>{m.saxlemPlace}</span>
        </div>
        <div>
          <span className="statement-label">{m.to}</span>
          <strong>{s.doctorName}</strong>
          <span>{s.organizationName}</span>
          {s.clinicNames.length > 0 && <span>{s.clinicNames.join("، ")}</span>}
        </div>
      </section>
      <section
        className={`statement-total ${net > 0 ? "pays" : net < 0 ? "owes" : "even"}`}
      >
        <span>{verdict}</span>
        <strong>{f.iqd(Math.abs(net))}</strong>
        <small>
          {net < 0
            ? s.dueAt
              ? m.payBy(f.day(s.dueAt))
              : m.inCash
            : net > 0
              ? s.payoutAccount
                ? m.byFibTo(
                    `${s.payoutAccount.name ?? ""} ${s.payoutAccount.numberHint}`.trim(),
                  )
                : m.byFibOrCash
              : m.noPayment}
        </small>
      </section>
      <section className="statement-section">
        <h2>{m.howItAddsUp}</h2>
        <table className="statement-table sums">
          <tbody>
            <tr>
              <td>{m.paidInApp(s.paymentCount)}</td>
              <td>{f.iqd(s.grossCollectedIqd)}</td>
            </tr>
            {s.clawbackIqd > 0 && (
              <tr>
                <td>{m.refundsBack}</td>
                <td>−{f.iqd(s.clawbackIqd)}</td>
              </tr>
            )}
            {s.providerFeeIqd > 0 && (
              <tr>
                <td>{m.fibFee(String(s.providerFeeBps / 100))}</td>
                <td>−{f.iqd(s.providerFeeIqd)}</td>
              </tr>
            )}
            <tr>
              <td>{m.commission(charges)}</td>
              <td>
                {s.commissionIqd ? "−" : ""}
                {f.iqd(s.commissionIqd)}
              </td>
            </tr>
            {s.carriedFrom.map((row) => (
              <tr key={row.cycleNumber}>
                <td>{m.unpaidFrom(row.statementNumber)}</td>
                <td>−{f.iqd(-row.amountIqd)}</td>
              </tr>
            ))}
            <tr className="sum-total">
              <td>{verdict}</td>
              <td>{f.iqd(Math.abs(net))}</td>
            </tr>
          </tbody>
        </table>
      </section>
      <section className="statement-section statement-facts">
        <div>
          <h2>{m.visits}</h2>
          <dl>
            <dt>{m.completed}</dt>
            <dd>{s.visits.completed}</dd>
            <dt>{m.noShows}</dt>
            <dd>{s.visits.noShow}</dd>
            <dt>{m.cancelled}</dt>
            <dd>{s.visits.cancelled}</dd>
            {s.visits.upcoming > 0 && (
              <>
                <dt>{m.upcoming}</dt>
                <dd>{s.visits.upcoming}</dd>
              </>
            )}
            <dt>{m.bookedInApp}</dt>
            <dd>{s.visits.app}</dd>
            <dt>{m.byPhone}</dt>
            <dd>{s.visits.phone}</dd>
            <dt>{m.walkIns}</dt>
            <dd>{s.visits.walkIn}</dd>
          </dl>
        </div>
        <div>
          <h2>{m.revenue}</h2>
          <dl>
            <dt>{m.atCounter(s.revenue.counterCount)}</dt>
            <dd>{f.iqd(s.revenue.counterIqd)}</dd>
            <dt>{m.inApp(s.revenue.onlineCount)}</dt>
            <dd>{f.iqd(s.revenue.onlineIqd)}</dd>
            <dt className="strong">{m.total}</dt>
            <dd className="strong">{f.iqd(s.revenue.totalIqd)}</dd>
          </dl>
          <p className="statement-note">{m.counterNote}</p>
        </div>
      </section>
      <section className="statement-section">
        <h2>{m.commissionTitle}</h2>
        {s.charges.length ? (
          <table className="statement-table">
            <thead>
              <tr>
                <th>{m.visit}</th>
                <th>{m.booking}</th>
                <th>{m.plan}</th>
                <th>{m.amount}</th>
              </tr>
            </thead>
            <tbody>
              {s.charges.map((line) => (
                <tr
                  key={line.id}
                  className={line.kind === "credit" ? "credit" : undefined}
                >
                  <td>{f.dayTime(line.appointmentStartsAt)}</td>
                  <td>
                    <span dir="ltr">{line.appointmentReference}</span>
                    {line.kind === "credit" && (
                      <small>{m.credit(line.reason ?? "")}</small>
                    )}
                  </td>
                  <td>{line.planName}</td>
                  <td>
                    {line.amountIqd < 0
                      ? `−${f.iqd(-line.amountIqd)}`
                      : f.iqd(line.amountIqd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="statement-empty">{m.noCommission}</p>
        )}
      </section>
      <section className="statement-section">
        <h2>{m.appPaymentsTitle}</h2>
        {s.onlinePayments.length ? (
          <table className="statement-table">
            <thead>
              <tr>
                <th>{m.paid}</th>
                <th>{m.booking}</th>
                <th>{m.amount}</th>
              </tr>
            </thead>
            <tbody>
              {s.onlinePayments.map((line) => (
                <tr key={line.id}>
                  <td>{f.dayTime(line.at)}</td>
                  <td dir="ltr">{line.appointmentReference}</td>
                  <td>{f.iqd(line.amountIqd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="statement-empty">{m.noAppPayments}</p>
        )}
        {s.refunds.length > 0 && (
          <>
            <h3>{m.refundsTitle}</h3>
            <table className="statement-table">
              <tbody>
                {s.refunds.map((line) => (
                  <tr key={line.id}>
                    <td>{f.dayTime(line.at)}</td>
                    <td dir="ltr">{line.appointmentReference}</td>
                    <td>−{f.iqd(line.amountIqd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>
      <section className="statement-section statement-settlement">
        <h2>{m.settlement}</h2>
        {s.settlement?.method === "carried" ? (
          <p className="statement-empty">
            {m.carriedNote(s.settlement.carriedIntoStatement ?? "")}
          </p>
        ) : s.settlement ? (
          <dl>
            <dt>{m.paid}</dt>
            <dd>
              {f.dayTime(s.settlement.settledAt)} ·{" "}
              {s.settlement.method === "cash" ? m.cash : m.fib}
            </dd>
            {s.settlement.reference && (
              <>
                <dt>
                  {s.settlement.method === "cash" ? m.receipt : m.reference}
                </dt>
                <dd dir="ltr">{s.settlement.reference}</dd>
              </>
            )}
            {s.settlement.counterpartyName && (
              <>
                <dt>{net < 0 ? m.paidBy : m.receivedBy}</dt>
                <dd>{s.settlement.counterpartyName}</dd>
              </>
            )}
            {s.settlement.settledByName && (
              <>
                <dt>{m.recordedBy}</dt>
                <dd dir="ltr">{s.settlement.settledByName}</dd>
              </>
            )}
            {s.settlement.note && (
              <>
                <dt>{m.note}</dt>
                <dd>{s.settlement.note}</dd>
              </>
            )}
          </dl>
        ) : (
          <p className="statement-empty">
            {s.status === "open"
              ? m.notSettledUntil(f.lastDay(s.periodEnd))
              : m.notSettled}
          </p>
        )}
        <div className="statement-signatures">
          <div>
            <span />
            {m.forSaxlem}
          </div>
          <div>
            <span />
            {m.doctorOrClinic(s.doctorName)}
          </div>
        </div>
      </section>
      <footer className="statement-foot">{m.footer(s.statementNumber)}</footer>
    </article>
  );
}
