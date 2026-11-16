import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app-shell";
import { PayoutSettleForm } from "@/components/payout-settle-form";
import { payoutDetail } from "@/data/owner-data";
import {
  baghdadDateTime,
  currentMonth,
  iqd,
  payoutStatusLabel,
} from "@/domain/money";
import { requireOwnerSession } from "@/infrastructure/auth";
import { OwnerApiError } from "@/infrastructure/api-client";

export default async function PayoutDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { organizationId } = await params;
  const { month: raw } = await searchParams;
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(raw ?? "")
    ? raw!
    : currentMonth();
  const session = await requireOwnerSession();
  let payout;
  try {
    payout = await payoutDetail(session, organizationId, month);
  } catch (error) {
    if (error instanceof OwnerApiError && error.status === 404) notFound();
    throw error;
  }
  const [label, tone] = payoutStatusLabel[payout.status];
  const monthName = new Intl.DateTimeFormat("en-IQ", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Baghdad",
  }).format(new Date(payout.periodStart));
  const rows: [string, number, string?][] = [
    ["Collected in the app", payout.grossCollectedIqd],
    ["Refunds already paid out, taken back", -payout.clawbackIqd],
    ["FIB fee", -payout.providerFeeIqd],
    [
      "Saxlem commission",
      -payout.commissionIqd,
      "Deducted here, so don’t collect it separately.",
    ],
  ];
  return (
    <>
      <Link className="back-link" href={`/payments?tab=payouts&month=${month}`}>
        ← Monthly payouts
      </Link>
      <PageHeader
        title={payout.organizationName}
        description={`Settlement for ${monthName}.`}
        action={
          <span className={`badge badge-${tone}`}>
            <span className="badge-dot" aria-hidden="true" />
            {label}
          </span>
        }
      />
      <div className="payout-layout">
        <section className="card detail-card">
          <h2>Summary</h2>
          <dl className="payout-lines">
            {rows.map(([name, value, hint]) => (
              <div key={name}>
                <dt>
                  {name}
                  {hint && <small>{hint}</small>}
                </dt>
                <dd className="numeric">{iqd(value)}</dd>
              </div>
            ))}
            <div className="payout-net">
              <dt>
                {payout.netPayableIqd >= 0
                  ? "Saxlem pays the clinic"
                  : "The clinic owes Saxlem"}
              </dt>
              <dd className="numeric">{iqd(Math.abs(payout.netPayableIqd))}</dd>
            </div>
          </dl>
          <p className="muted">
            {payout.paymentCount} online{" "}
            {payout.paymentCount === 1 ? "payment" : "payments"}.{" "}
            {payout.payoutAccount
              ? `Pay to ${payout.payoutAccount.name ?? "account"} ${payout.payoutAccount.numberHint}.`
              : "No payout account is saved for this organization yet (Payments → Clinics)."}
          </p>
        </section>
        <section className="card detail-card">
          <h2>By doctor</h2>
          {payout.doctors?.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Payments</th>
                  <th>Collected</th>
                </tr>
              </thead>
              <tbody>
                {payout.doctors.map((doctor) => (
                  <tr key={doctor.doctorId}>
                    <td>{doctor.doctorName}</td>
                    <td className="numeric">{doctor.paymentCount}</td>
                    <td className="numeric">{iqd(doctor.grossIqd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">No online payments in this settlement.</p>
          )}
        </section>
      </div>
      {payout.status === "ready" && (
        <PayoutSettleForm
          organizationId={payout.organizationId}
          organizationName={payout.organizationName}
          month={month}
          netPayableIqd={payout.netPayableIqd}
        />
      )}
      {payout.status === "open" && (
        <p className="filter-note">
          This month is still running. You can record the payout once it ends.
        </p>
      )}
      {payout.settlement && (
        <section className="card detail-card">
          <h2>Recorded</h2>
          <dl>
            <dt>Reference</dt>
            <dd>{payout.settlement.reference}</dd>
            <dt>Recorded at</dt>
            <dd>{baghdadDateTime(payout.settlement.settledAt)}</dd>
            {payout.settlement.note && (
              <>
                <dt>Note</dt>
                <dd>{payout.settlement.note}</dd>
              </>
            )}
          </dl>
        </section>
      )}
    </>
  );
}
