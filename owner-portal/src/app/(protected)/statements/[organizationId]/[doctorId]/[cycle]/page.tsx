import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton, SettleStatementForm } from "@/components/billing-forms";
import { StatementDocument } from "@/components/statement-document";
import { statementDocument } from "@/data/owner-data";
import { OwnerApiError } from "@/infrastructure/api-client";
import { requireOwnerSession } from "@/infrastructure/auth";
import { z } from "zod";

export default async function StatementPage({
  params,
}: {
  params: Promise<{ organizationId: string; doctorId: string; cycle: string }>;
}) {
  const { organizationId, doctorId, cycle } = await params;
  const number = Number(cycle);
  if (
    !z.string().uuid().safeParse(organizationId).success ||
    !z.string().uuid().safeParse(doctorId).success ||
    !Number.isInteger(number) ||
    number < 1
  )
    notFound();
  const session = await requireOwnerSession();
  let statement;
  try {
    statement = await statementDocument(
      session,
      organizationId,
      doctorId,
      number,
    );
  } catch (error) {
    if (error instanceof OwnerApiError && error.status === 404) notFound();
    throw error;
  }
  return (
    <>
      <Link className="back-link no-print" href="/statements">
        ← Statements
      </Link>
      <div className="statement-actions no-print">
        <PrintButton />
        {number > 1 && (
          <Link
            className="button button-secondary"
            href={`/statements/${organizationId}/${doctorId}/${number - 1}`}
          >
            ← Previous statement
          </Link>
        )}
        {statement.status !== "open" && (
          <Link
            className="button button-secondary"
            href={`/statements/${organizationId}/${doctorId}/${number + 1}`}
          >
            Next statement →
          </Link>
        )}
      </div>
      <StatementDocument statement={statement} />
      {statement.canSettle && <SettleStatementForm statement={statement} />}
      {statement.status === "waiting" && (
        <p className="filter-note no-print">
          Settle this doctor&apos;s older statement first; statements are
          settled in order.
        </p>
      )}
    </>
  );
}
