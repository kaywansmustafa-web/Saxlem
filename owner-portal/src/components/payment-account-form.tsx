"use client";
import { useState } from "react";

type Account = {
  organizationId: string;
  connected: boolean;
  provider: "fib" | "simulated" | null;
  environment: string | null;
  onlineEnabled: boolean;
};

/** Connect or update one organization's FIB merchant account. */
export function PaymentAccountForm({
  account,
  allowSimulated,
}: {
  account: Account;
  allowSimulated: boolean;
}) {
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [provider, setProvider] = useState<"fib" | "simulated">(
      account.provider ?? "fib",
    );
  if (!open)
    return (
      <button
        type="button"
        className="button button-secondary"
        onClick={() => setOpen(true)}
      >
        {account.connected ? "Update" : "Connect FIB"}
      </button>
    );
  return (
    <form
      className="payment-account-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setMessage("");
        const raw = Object.fromEntries(new FormData(event.currentTarget));
        try {
          const response = await fetch(
            `/api/platform/payment-accounts/${account.organizationId}`,
            {
              method: "PUT",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                provider,
                environment:
                  provider === "simulated"
                    ? "simulated"
                    : String(raw.environment),
                clientId: String(raw.clientId),
                clientSecret: String(raw.clientSecret),
                onlineEnabled: raw.onlineEnabled === "on",
              }),
            },
          );
          const result = (await response.json()) as {
            ok?: boolean;
            error?: { message?: string };
          };
          if (!response.ok || !result.ok)
            throw new Error(result.error?.message ?? "Could not save.");
          window.location.reload();
        } catch (error) {
          setMessage(
            error instanceof Error ? error.message : "Could not save.",
          );
          setBusy(false);
        }
      }}
    >
      {allowSimulated && (
        <label className="field">
          Provider
          <select
            value={provider}
            onChange={(event) =>
              setProvider(event.target.value as "fib" | "simulated")
            }
          >
            <option value="fib">First Iraqi Bank (FIB)</option>
            <option value="simulated">Simulated (testing only)</option>
          </select>
        </label>
      )}
      {provider === "fib" && (
        <label className="field">
          FIB environment
          <select
            name="environment"
            defaultValue={account.environment === "prod" ? "prod" : "stage"}
          >
            <option value="stage">Test (stage)</option>
            <option value="prod">Live (production)</option>
          </select>
        </label>
      )}
      <label className="field">
        Client ID
        <input name="clientId" required maxLength={200} autoComplete="off" />
      </label>
      <label className="field">
        Client secret
        <input
          name="clientSecret"
          type="password"
          required
          minLength={8}
          maxLength={500}
          autoComplete="new-password"
        />
      </label>
      <label className="check-field">
        <input
          name="onlineEnabled"
          type="checkbox"
          defaultChecked={account.connected ? account.onlineEnabled : true}
        />
        Patients can pay in the app
      </label>
      {message && (
        <p className="form-error" role="alert">
          {message}
        </p>
      )}
      <div className="form-actions">
        <button className="button button-primary" disabled={busy}>
          {busy ? "Checking with FIB…" : "Save and verify"}
        </button>
        <button
          type="button"
          className="button button-secondary"
          disabled={busy}
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
