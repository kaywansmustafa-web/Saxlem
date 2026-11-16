import { PageHeader, StateView, StatusBadge } from "@/components/app-shell";
import { PaymentAccountForm } from "@/components/payment-account-form";
import {
  listOrganizations,
  paymentAccount,
  type PaymentAccount,
} from "@/data/owner-data";
import { requireOwnerSession } from "@/infrastructure/auth";
import { ownerConfiguration } from "@/infrastructure/config";

export default async function PaymentsPage() {
  const session = await requireOwnerSession();
  const organizations = (await listOrganizations(session)).items;
  const accounts = await Promise.all(
    organizations.map((organization) =>
      paymentAccount(session, organization.id).catch(
        () => null as PaymentAccount | null,
      ),
    ),
  );
  const platformOn = accounts.some((account) => account?.platformOnlineEnabled);
  const allowSimulated = ownerConfiguration().environment !== "production";
  return (
    <>
      <PageHeader
        title="Online payments"
        description="Patients can pay in the app with FIB. Each organization connects its own FIB business account, so money goes straight to the clinic. Saxlem never holds patient money."
      />
      {!platformOn && organizations.length > 0 && (
        <p className="filter-note">
          Online payments are switched off for the whole platform. Patients only
          see “Pay at the clinic” until they are switched on.
        </p>
      )}
      {organizations.length ? (
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
                        ? `${account.provider === "simulated" ? "Simulated" : "FIB"} · ${
                            account.environment === "prod"
                              ? "Live"
                              : account.environment === "stage"
                                ? "Test"
                                : "Testing only"
                          } · client ${account.clientIdHint}`
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
                {account ? (
                  <PaymentAccountForm
                    account={account}
                    allowSimulated={allowSimulated}
                  />
                ) : (
                  <p className="muted">Payment status is unavailable.</p>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <StateView
          title="No organizations"
          description="Create an organization first, then connect its FIB account."
        />
      )}
    </>
  );
}
