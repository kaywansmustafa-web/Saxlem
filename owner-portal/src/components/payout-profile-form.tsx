"use client";
import { useState } from "react";

/** Per-organization switch for paying in the app, and where Saxlem pays it. */
export function PayoutProfileForm({
  organizationId,
  profile,
}: {
  organizationId: string;
  profile: {
    onlinePaymentsEnabled: boolean;
    payoutAccountName: string | null;
    payoutAccountNumberHint: string | null;
  };
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  return (
    <form
      className="payout-profile-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setMessage("");
        const raw = Object.fromEntries(new FormData(event.currentTarget));
        const number = String(raw.payoutAccountNumber ?? "").trim();
        try {
          const response = await fetch(
            `/api/platform/payout-profiles/${organizationId}`,
            {
              method: "PUT",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                onlinePaymentsEnabled: raw.onlinePaymentsEnabled === "on",
                payoutAccountName:
                  String(raw.payoutAccountName ?? "").trim() || null,
                // Leave the saved number alone unless a new one is typed.
                ...(number ? { payoutAccountNumber: number } : {}),
              }),
            },
          );
          const result = (await response.json()) as {
            ok?: boolean;
            error?: { message?: string };
          };
          if (!response.ok || !result.ok)
            throw new Error(result.error?.message ?? "Could not save.");
          setMessage("Saved.");
          window.location.reload();
        } catch (error) {
          setMessage(
            error instanceof Error ? error.message : "Could not save.",
          );
          setBusy(false);
        }
      }}
    >
      <label className="check-field">
        <input
          name="onlinePaymentsEnabled"
          type="checkbox"
          defaultChecked={profile.onlinePaymentsEnabled}
        />
        Patients can pay in the app
      </label>
      <label className="field">
        Payout account name
        <input
          name="payoutAccountName"
          maxLength={200}
          defaultValue={profile.payoutAccountName ?? ""}
          autoComplete="off"
        />
      </label>
      <label className="field">
        FIB account number or IBAN
        <input
          name="payoutAccountNumber"
          maxLength={64}
          pattern="[A-Za-z0-9 ]{4,64}"
          placeholder={
            profile.payoutAccountNumberHint
              ? `Saved: ${profile.payoutAccountNumberHint}`
              : "Where Saxlem sends the monthly payout"
          }
          autoComplete="off"
        />
      </label>
      {message && (
        <p className="form-error" role="status">
          {message}
        </p>
      )}
      <div className="form-actions">
        <button className="button button-secondary" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
