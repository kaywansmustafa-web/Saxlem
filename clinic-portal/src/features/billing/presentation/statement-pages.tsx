import "server-only";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n";
import { PortalApiError } from "@/infrastructure/api/api-error";
import { billingComposition } from "@/infrastructure/billing-composition";
import type { CycleStatement, CycleStatementDocument } from "../domain/models";
import { PrintButton } from "./print-button";
import { StatementSheet } from "./statement-sheet";
import { StatementsOverview } from "./statements-overview";
import { statementMessages } from "./statement-messages";

const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

const Unavailable = ({ text }: { text: string }) => (
  <div className="state">
    <div>
      <h1>{text}</h1>
    </div>
  </div>
);

/** Statements list. Doctors see their own; reception sees their doctors. */
export async function StatementsListPage({
  locale,
  doctorView,
}: {
  locale: Locale;
  doctorView: boolean;
}) {
  const m = statementMessages(locale);
  let rows: readonly CycleStatement[] | null = null;
  try {
    const composition = await billingComposition();
    rows = (await composition.read?.cycleStatements()) ?? null;
  } catch {
    rows = null;
  }
  if (!rows) return <Unavailable text={m.unavailable} />;
  return (
    <StatementsOverview
      statements={rows}
      locale={locale}
      showCommissionsLink={!doctorView}
      basePath={(row) =>
        doctorView
          ? `/${locale}/doctor/billing/${row.cycleNumber}`
          : `/${locale}/billing/statements/${row.doctorId}/${row.cycleNumber}`
      }
    />
  );
}

/** One statement, printable. */
export async function StatementDocumentPage({
  locale,
  doctorId,
  cycle,
  doctorView,
}: {
  locale: Locale;
  doctorId?: string;
  cycle: string;
  doctorView: boolean;
}) {
  const m = statementMessages(locale);
  const number = Number(cycle);
  if (!Number.isInteger(number) || number < 1) notFound();
  if (doctorId && !uuid.test(doctorId)) notFound();
  let statement: CycleStatementDocument | null = null;
  let missing = false;
  try {
    const composition = await billingComposition();
    const read = composition.read;
    // A doctor's own id comes from their statements list.
    const ownId =
      doctorId ?? (await read?.cycleStatements())?.[0]?.doctorId ?? null;
    if (read && ownId) statement = await read.cycleStatement(ownId, number);
    else missing = true;
  } catch (error) {
    missing = error instanceof PortalApiError && error.detail.status === 404;
  }
  if (missing) notFound();
  if (!statement) return <Unavailable text={m.unavailable} />;
  const base = doctorView
    ? `/${locale}/doctor/billing`
    : `/${locale}/billing/statements/${statement.doctorId}`;
  return (
    <div className="statement-page">
      <div className="statement-actions no-print">
        <Link
          href={doctorView ? `/${locale}/doctor/billing` : `/${locale}/billing`}
        >
          ← {m.back}
        </Link>
        <PrintButton label={m.print} />
        {number > 1 && <Link href={`${base}/${number - 1}`}>{m.previous}</Link>}
        {statement.status !== "open" && (
          <Link href={`${base}/${number + 1}`}>{m.next}</Link>
        )}
      </div>
      <StatementSheet statement={statement} locale={locale} />
    </div>
  );
}
