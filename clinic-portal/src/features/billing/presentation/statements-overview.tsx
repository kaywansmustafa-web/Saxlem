import Link from "next/link";
import type { Locale } from "@/i18n";
import type { CycleStatement } from "../domain/models";
import { statementFormat } from "./statement-format";
import { statementMessages } from "./statement-messages";

/** Each doctor's running statement on top, then every earlier statement. */
export function StatementsOverview({
  statements,
  locale,
  basePath,
  showCommissionsLink,
}: {
  statements: readonly CycleStatement[];
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
                <span className={`statement-status ${row.status}`}>
                  {m.short[row.status]}
                </span>
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
