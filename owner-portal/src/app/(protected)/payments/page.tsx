import Link from "next/link";
import { PageHeader, StateView, StatusBadge } from "@/components/app-shell";
import { PaymentAccountForm } from "@/components/payment-account-form";
import { PayoutProfileForm } from "@/components/payout-profile-form";
import {
  listOrganizations,
  paymentAccount,
  paymentLedger,
  paymentSettings,
  payoutProfile,
  payoutSummary,
  type PaymentSettings,
} from "@/data/owner-data";
import {
  baghdadDateTime as when,
  currentMonth,
  iqd,
  payoutStatusLabel,
} from "@/domain/money";
import type { OwnerSession } from "@/domain/session";
import { requireOwnerSession } from "@/infrastructure/auth";
import { ownerConfiguration } from "@/infrastructure/config";

type Tab = "ledger" | "payouts" | "clinics";
const tabs: readonly [Tab, string][] = [
  ["ledger", "Payments"],
  ["payouts", "Monthly payouts"],
  ["clinics", "Clinics"],
];

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; month?: string; method?: string }>;
}) {
  const query = await searchParams;
  const tab: Tab = (["ledger", "payouts", "clinics"] as const).includes(
    query.tab as Tab,
  )
    ? (query.tab as Tab)
    : "ledger";
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(query.month ?? "")
    ? query.month!
    : currentMonth();
  const session = await requireOwnerSession();
  const settings = await paymentSettings(session);
  return (
    <>
      <PageHeader
        title="Payments"
        description={
          settings.collectionMode === "platform"
            ? "Online payments go into Saxlem’s FIB account. Every payment is recorded here, and Saxlem pays each clinic once a month."
            : "Online payments go into each clinic’s own FIB account. Every payment is recorded here."
        }
      />
      <CollectionBanner settings={settings} />
      <nav className="tabs" aria-label="Payments sections">
        {tabs.map(([id, label]) => (
          <Link
            key={id}
            href={`/payments?tab=${id}&month=${month}`}
            aria-current={tab === id ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
      {tab !== "clinics" && (
        <form className="month-filter" method="get">
          <input type="hidden" name="tab" value={tab} />
          <label className="field">
            Month
            <input type="month" name="month" defaultValue={month} />
          </label>
          {tab === "ledger" && (
            <label className="field">
              Method
              <select name="method" defaultValue={query.method ?? ""}>
                <option value="">All</option>
                <option value="online">In the app</option>
                <option value="counter">At the counter</option>
              </select>
            </label>
          )}
          <button className="button button-secondary">Show</button>
        </form>
      )}
      {tab === "ledger" && (
        <Ledger session={session} month={month} method={query.method} />
      )}
      {tab === "payouts" && <Payouts session={session} month={month} />}
      {tab === "clinics" && <Clinics session={session} settings={settings} />}
    </>
  );
}

function CollectionBanner({ settings }: { settings: PaymentSettings }) {
  const account = settings.platformAccount;
  return (
    <section className="card collection-banner">
      <div>
        <p className="eyebrow-small">How patients pay online</p>
        <strong>
          {settings.collectionMode === "platform"
            ? account
              ? `Into Saxlem’s ${account.provider === "fib" ? "FIB" : "simulated"} account (${account.clientIdHint}, ${account.environment === "prod" ? "live" : account.environment === "stage" ? "test" : "testing only"})`
              : "Into Saxlem’s FIB account (not connected yet)"
            : "Into each clinic’s own FIB account"}
        </strong>
        <span>
          {settings.onlineEnabled
            ? "Online payments are on."
            : "Online payments are off for the whole platform. Patients only see “Pay at the clinic”."}
          {settings.collectionMode === "platform" &&
            ` FIB fee ${settings.providerFeeBps / 100}% ${settings.feePassedToClinic ? "is deducted from clinic payouts" : "is paid by Saxlem"}.`}
        </span>
      </div>
      <StatusBadge status={settings.onlineEnabled ? "active" : "inactive"} />
    </section>
  );
}

async function Ledger({
  session,
  month,
  method,
}: {
  session: OwnerSession;
  month: string;
  method?: string;
}) {
  const page = await paymentLedger(session, month, {
    method: method === "online" || method === "counter" ? method : undefined,
  });
  if (!page.items.length)
    return (
      <StateView
        title="No payments this month"
        description="Payments appear here as soon as a patient chooses how to pay."
      />
    );
  const collected = page.items
    .filter((item) => item.method === "online" && item.status === "paid")
    .reduce((sum, item) => sum + item.amountIqd, 0);
  return (
    <>
      <p className="ledger-total">
        Paid in the app this month: <strong>{iqd(collected)}</strong>
      </p>
      <div className="card table-card" tabIndex={0} aria-label="Payments">
        <table className="table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Clinic</th>
              <th>Amount</th>
              <th>How</th>
              <th>Status</th>
              <th>Booked</th>
              <th>Paid</th>
              <th>Appointment</th>
            </tr>
          </thead>
          <tbody>
            {page.items.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.patientName}</strong>
                  {item.payerName && item.payerName !== item.patientName && (
                    <small>Paid by {item.payerName}</small>
                  )}
                </td>
                <td>{item.doctorName}</td>
                <td>
                  {item.clinicName}
                  <small>{item.organizationName}</small>
                </td>
                <td className="numeric">{iqd(item.amountIqd)}</td>
                <td>
                  {item.method === "online" ? "In the app" : "At the counter"}
                </td>
                <td>
                  <StatusBadge status={item.status} />
                  {item.payoutId && <small>Paid out</small>}
                </td>
                <td>{when(item.bookedAt)}</td>
                <td>{when(item.paidAt)}</td>
                <td>
                  {when(item.appointmentStartsAt)}
                  <small>{item.appointmentReference}</small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {page.nextCursor && (
        <p className="muted">Showing the latest 100 payments for this month.</p>
      )}
    </>
  );
}

async function Payouts({
  session,
  month,
}: {
  session: OwnerSession;
  month: string;
}) {
  const summary = await payoutSummary(session, month);
  const active = summary.items.filter(
    (item) =>
      item.status === "settled" ||
      item.paymentCount > 0 ||
      item.clawbackIqd > 0 ||
      item.commissionIqd !== 0,
  );
  const totalNet = active
    .filter((item) => item.status !== "settled")
    .reduce((sum, item) => sum + Math.max(item.netPayableIqd, 0), 0);
  return (
    <>
      {!summary.monthEnded && (
        <p className="filter-note">
          This month is still running. Amounts can still change; payouts can be
          recorded once it ends.
        </p>
      )}
      {active.length ? (
        <>
          <p className="ledger-total">
            Still to pay clinics for this month:{" "}
            <strong>{iqd(totalNet)}</strong>
          </p>
          <div className="card table-card" tabIndex={0} aria-label="Payouts">
            <table className="table">
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Payments</th>
                  <th>Collected</th>
                  <th>Refunds back</th>
                  <th>FIB fee</th>
                  <th>Commission</th>
                  <th>Net</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {active.map((item) => (
                  <tr key={item.organizationId}>
                    <td>
                      <strong>{item.organizationName}</strong>
                      {item.payoutAccount ? (
                        <small>
                          {item.payoutAccount.name ?? "Account"}{" "}
                          {item.payoutAccount.numberHint}
                        </small>
                      ) : (
                        <small>No payout account yet</small>
                      )}
                    </td>
                    <td className="numeric">{item.paymentCount}</td>
                    <td className="numeric">{iqd(item.grossCollectedIqd)}</td>
                    <td className="numeric">{iqd(item.clawbackIqd)}</td>
                    <td className="numeric">{iqd(item.providerFeeIqd)}</td>
                    <td className="numeric">{iqd(item.commissionIqd)}</td>
                    <td className="numeric">
                      <strong>{iqd(item.netPayableIqd)}</strong>
                      <small>
                        {item.netPayableIqd >= 0
                          ? "Saxlem pays clinic"
                          : "Clinic owes Saxlem"}
                      </small>
                    </td>
                    <td>
                      <span
                        className={`badge badge-${payoutStatusLabel[item.status][1]}`}
                      >
                        <span className="badge-dot" aria-hidden="true" />
                        {payoutStatusLabel[item.status][0]}
                      </span>
                    </td>
                    <td>
                      <Link
                        className="button button-secondary"
                        href={`/payments/payouts/${item.organizationId}?month=${month}`}
                      >
                        {item.status === "ready" ? "Review and pay" : "View"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <StateView
          title="Nothing to settle"
          description="No online payments or commission for this month yet."
        />
      )}
    </>
  );
}

async function Clinics({
  session,
  settings,
}: {
  session: OwnerSession;
  settings: PaymentSettings;
}) {
  const organizations = (await listOrganizations(session)).items;
  if (!organizations.length)
    return (
      <StateView
        title="No organizations"
        description="Create an organization first."
      />
    );
  if (settings.collectionMode === "clinic") {
    const accounts = await Promise.all(
      organizations.map((o) => paymentAccount(session, o.id).catch(() => null)),
    );
    const allowSimulated = ownerConfiguration().environment !== "production";
    return (
      <div className="payment-accounts">
        {organizations.map((organization, index) => {
          const account = accounts[index];
          return (
            <section className="card payment-account" key={organization.id}>
              <div className="payment-account-head">
                <div>
                  <h2>{organization.name}</h2>
                  <p>
                    {account?.connected
                      ? `FIB connected · client ${account.clientIdHint}`
                      : "Not connected. Patients pay at the clinic."}
                  </p>
                </div>
                <StatusBadge
                  status={
                    account?.connected && account.onlineEnabled
                      ? "active"
                      : "inactive"
                  }
                />
              </div>
              {account && (
                <PaymentAccountForm
                  account={account}
                  allowSimulated={allowSimulated}
                />
              )}
            </section>
          );
        })}
      </div>
    );
  }
  const profiles = await Promise.all(
    organizations.map((o) => payoutProfile(session, o.id).catch(() => null)),
  );
  return (
    <div className="payment-accounts">
      {organizations.map((organization, index) => {
        const profile = profiles[index];
        return (
          <section className="card payment-account" key={organization.id}>
            <div className="payment-account-head">
              <div>
                <h2>{organization.name}</h2>
                <p>
                  {profile?.onlinePaymentsEnabled
                    ? "Patients can pay in the app."
                    : "Patients pay at the clinic only."}{" "}
                  {profile?.payoutAccountNumberHint
                    ? `Payouts to ${profile.payoutAccountName ?? "account"} ${profile.payoutAccountNumberHint}.`
                    : "No payout account yet."}
                </p>
              </div>
              <StatusBadge
                status={profile?.onlinePaymentsEnabled ? "active" : "inactive"}
              />
            </div>
            {profile ? (
              <PayoutProfileForm
                organizationId={organization.id}
                profile={profile}
              />
            ) : (
              <p className="muted">Settings are unavailable right now.</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
