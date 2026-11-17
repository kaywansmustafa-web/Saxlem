"use client";
import { useState } from "react";

/** Where Saxlem sends one doctor's monthly payout of in-app payments. */
export function DoctorPayoutAccountForm({
  organizationId,
  doctorId,
  profile,
}: {
  organizationId: string;
  doctorId: string;
  profile: {
    payoutAccountName: string | null;
    payoutAccountNumberHint: string | null;
  } | null;
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
            `/api/platform/doctor-payout-profiles/${organizationId}/${doctorId}`,
            {
              method: "PUT",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
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
          window.location.reload();
        } catch (error) {
          setMessage(
            error instanceof Error ? error.message : "Could not save.",
          );
          setBusy(false);
        }
      }}
    >
      <label className="field">
        Account holder
        <input
          name="payoutAccountName"
          maxLength={200}
          defaultValue={profile?.payoutAccountName ?? ""}
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
            profile?.payoutAccountNumberHint
              ? `Saved: ${profile.payoutAccountNumberHint}`
              : "Where Saxlem sends this doctor's payout"
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
          {busy ? "Saving…" : "Save account"}
        </button>
      </div>
    </form>
  );
}
