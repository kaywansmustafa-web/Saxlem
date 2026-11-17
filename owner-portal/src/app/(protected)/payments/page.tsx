import Link from "next/link";
import { PageHeader, StateView, StatusBadge } from "@/components/app-shell";
import { DoctorPayoutAccountForm } from "@/components/doctor-payout-account-form";
import { PaymentAccountForm } from "@/components/payment-account-form";
import { PayoutProfileForm } from "@/components/payout-profile-form";
import {
  listOrganizations,
  paymentAccount,
  paymentLedger,
  paymentSettings,
  payoutProfile,
  listBillingStatements,
  doctorPayoutProfile,
  type PaymentSettings,
} from "@/data/owner-data";
import { baghdadDateTime as when, currentMonth, iqd } from "@/domain/money";
import type { OwnerSession } from "@/domain/session";
import { requireOwnerSession } from "@/infrastructure/auth";
import { ownerConfiguration } from "@/infrastructure/config";

type Tab = "ledger" | "clinics";
const tabs: readonly [Tab, string][] = [
  ["ledger", "Payments"],
  ["clinics", "Clinics and doctors"],
];

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; month?: string; method?: string }>;
}) {
  const query = await searchParams;
  const tab: Tab = (["ledger", "clinics"] as const).includes(query.tab as Tab)
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
            ? "Online payments go into Saxlem’s FIB account. Every payment is recorded here, and Saxlem settles with each doctor every 30 days (see Statements)."
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
            ` FIB fee ${settings.providerFeeBps / 100}% ${settings.feePassedToClinic ? "is deducted from doctor payouts" : "is paid by Saxlem"}.`}
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
  const [profiles, statements] = await Promise.all([
    Promise.all(
      organizations.map((o) => payoutProfile(session, o.id).catch(() => null)),
    ),
    // Every billed doctor has a running statement.
    listBillingStatements(session)
      .then((list) => list.items)
      .catch(() => []),
  ]);
  const seen = new Set<string>();
  const billed = statements.filter((item) => {
    const key = `${item.organizationId}:${item.doctorId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const accounts = await Promise.all(
    billed.map((item) =>
      doctorPayoutProfile(session, item.organizationId, item.doctorId).catch(
        () => null,
      ),
    ),
  );
  const payees = billed.map((item, index) => {
    const account = accounts[index];
    return {
      organizationId: item.organizationId,
      doctorId: item.doctorId,
      doctorName: item.doctorName,
      payoutAccount: account?.payoutAccountNumberHint
        ? {
            name: account.payoutAccountName,
            numberHint: account.payoutAccountNumberHint,
          }
        : null,
    };
  });
  return (
    <div className="payment-accounts">
      {organizations.map((organization, index) => {
        const profile = profiles[index];
        const doctors = payees.filter(
          (item) => item.organizationId === organization.id,
        );
        return (
          <section className="card payment-account" key={organization.id}>
            <div className="payment-account-head">
              <div>
                <h2>{organization.name}</h2>
                <p>
                  {profile?.onlinePaymentsEnabled
                    ? "Patients can pay in the app."
                    : "Patients pay at the clinic only."}{" "}
                  Each doctor is billed and paid separately.
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
            <h3 className="doctor-accounts-title">
              Doctors&apos; payout accounts
            </h3>
            {doctors.length ? (
              <ul className="doctor-accounts">
                {doctors.map((doctor) => (
                  <li key={doctor.doctorId}>
                    <details>
                      <summary>
                        <strong>{doctor.doctorName}</strong>
                        <span className="muted">
                          {doctor.payoutAccount
                            ? `${doctor.payoutAccount.name ?? "Account"} ${doctor.payoutAccount.numberHint}`
                            : "No account yet"}
                        </span>
                      </summary>
                      <DoctorPayoutAccountForm
                        organizationId={organization.id}
                        doctorId={doctor.doctorId}
                        profile={
                          doctor.payoutAccount
                            ? {
                                payoutAccountName: doctor.payoutAccount.name,
                                payoutAccountNumberHint:
                                  doctor.payoutAccount.numberHint,
                              }
                            : null
                        }
                      />
                    </details>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No doctors in this organization yet.</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
