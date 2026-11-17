import Link from "next/link";
import type { Locale } from "@/i18n";
import type { Collection, CycleStatement } from "../domain/models";
import { statementFormat } from "./statement-format";
import { statementMessages } from "./statement-messages";

/** Each doctor's running statement on top, then every earlier statement. */
export function StatementsOverview({
  statements,
  collections,
  locale,
  basePath,
  showCommissionsLink,
}: {
  statements: readonly CycleStatement[];
  /** Doctors who owe Saxlem: shown as reminders at the top. */
  collections: readonly Collection[];
  locale: Locale;
  /** e.g. /en/billing/statements — the doctor and cycle are appended. */
  basePath: (row: CycleStatement) => string;
  showCommissionsLink: boolean;
}) {
  const m = statementMessages(locale);
  const f = statementFormat(locale, m.iqd);
  const current = statements.filter((row) => row.status === "open");
  const earlier = statements.filter((row) => row.status !== "open");
  const result = (row: CycleStatement) => (
    <>
      <strong
        className={
          row.direction === "doctorPays"
            ? "owes"
            : row.direction === "saxlemPays"
              ? "pays"
              : undefined
        }
      >
        {f.iqd(Math.abs(row.netPayableIqd))}
      </strong>
      <small>
        {row.direction === "saxlemPays"
          ? m.saxlemPays(row.doctorName)
          : row.direction === "doctorPays"
            ? m.doctorPays(row.doctorName)
            : m.even}
      </small>
    </>
  );
  return (
    <section
      className="billing-workspace statements-overview"
      aria-labelledby="billing-title"
    >
      <header>
        <h1 id="billing-title">{m.billing}</h1>
        <p>{m.intro}</p>
        {showCommissionsLink && (
          <nav className="billing-tabs" aria-label={m.billing}>
            <Link href={`/${locale}/billing`} aria-current="page">
              {m.history}
            </Link>
            <Link href={`/${locale}/billing/commissions`}>
              {m.commissionsTab}
            </Link>
          </nav>
        )}
      </header>
      {collections
        .filter((item) => item.stage !== "clear")
        .map((item) => {
          const amount = f.iqd(item.owedIqd);
          const text =
            item.stage === "hidden"
              ? m.remindHidden(item.doctorName, amount)
              : item.stage === "warning"
                ? m.remindWarning(
                    item.doctorName,
                    amount,
                    item.hideOn ? f.day(item.hideOn) : "",
                  )
                : item.stage === "overdue"
                  ? m.remindOverdue(
                      item.doctorName,
                      amount,
                      item.dueAt ? f.day(item.dueAt) : "",
                    )
                  : m.remindDue(
                      item.doctorName,
                      amount,
                      item.statementNumber ?? "",
                      item.dueAt ? f.day(item.dueAt) : "",
                    );
          return (
            <div
              key={item.doctorId}
              className={`billing-reminder ${item.stage}`}
              role={item.stage === "due" ? "status" : "alert"}
            >
              <strong>{m.reminder}</strong>
              <p>{text}</p>
            </div>
          );
        })}
      {current.length > 0 && (
        <div className="billing-doctors">
          {current.map((row) => (
            <article className="billing-card statement-card" key={row.doctorId}>
              <p className="eyebrow">{m.current}</p>
              <h2>{row.doctorName}</h2>
              <p className="muted">
                {f.day(row.periodStart)} – {f.lastDay(row.periodEnd)} ·{" "}
                {m.runningUntil(f.lastDay(row.periodEnd))}
              </p>
              <dl>
                <div>
                  <dt>{m.commissionSoFar}</dt>
                  <dd>{f.iqd(row.commissionIqd)}</dd>
                </div>
                <div>
                  <dt>{m.appPayments}</dt>
                  <dd>{f.iqd(row.grossCollectedIqd)}</dd>
                </div>
                <div>
                  <dt>{m.result}</dt>
                  <dd className="statement-result">{result(row)}</dd>
                </div>
              </dl>
              <Link className="button-link" href={basePath(row)}>
                {m.view}
              </Link>
            </article>
          ))}
        </div>
      )}
      <section className="billing-card">
        <h2>{m.history}</h2>
        {earlier.length ? (
          <ul className="statement-rows">
            {earlier.map((row) => (
              <li key={`${row.doctorId}:${row.cycleNumber}`}>
                <div>
                  <strong>{row.doctorName}</strong>
                  <small dir="ltr">{row.statementNumber}</small>
                </div>
                <span>
                  {f.day(row.periodStart)} – {f.lastDay(row.periodEnd)}
                </span>
                {row.settlement?.method === "carried" ? (
                  <span className="statement-status due">
                    {m.short.carried}
                  </span>
                ) : (
                  <span className={`statement-status ${row.status}`}>
                    {m.short[row.status]}
                  </span>
                )}
                <span className="statement-result">{result(row)}</span>
                <Link href={basePath(row)}>{m.view}</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>{m.noStatements}</p>
        )}
      </section>
    </section>
  );
}
