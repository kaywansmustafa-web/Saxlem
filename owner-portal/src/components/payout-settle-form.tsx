"use client";
import { useState } from "react";

/** Records that Saxlem paid (or received) a month's settlement. */
export function PayoutSettleForm({
  organizationId,
  organizationName,
  month,
  netPayableIqd,
}: {
  organizationId: string;
  organizationName: string;
  month: string;
  netPayableIqd: number;
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const amount = `${Math.abs(netPayableIqd).toLocaleString("en-IQ")} IQD`;
  const direction =
    netPayableIqd >= 0
      ? `Saxlem pays ${organizationName} ${amount}`
      : `${organizationName} pays Saxlem ${amount}`;
  return (
    <form
      className="card detail-card settle-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setMessage("");
        const raw = Object.fromEntries(new FormData(event.currentTarget));
        try {
          const response = await fetch(
            `/api/platform/payouts/${organizationId}`,
            {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                month,
                expectedNetPayableIqd: netPayableIqd,
                reference: String(raw.reference),
                ...(String(raw.note ?? "").trim()
                  ? { note: String(raw.note) }
                  : {}),
              }),
            },
          );
          const result = (await response.json()) as {
            ok?: boolean;
            error?: { message?: string };
          };
          if (!response.ok || !result.ok)
            throw new Error(result.error?.message ?? "Could not record it.");
          window.location.reload();
        } catch (error) {
          setMessage(
            error instanceof Error ? error.message : "Could not record it.",
          );
          setBusy(false);
        }
      }}
    >
      <h2>Record the transfer</h2>
      <p className="settle-direction">{direction}</p>
      <p className="muted">
        Send the money first, then record it here with the transfer reference.
        This locks the month and can’t be undone.
      </p>
      <label className="field">
        Transfer reference
        <input
          name="reference"
          required
          maxLength={120}
          placeholder="FIB transaction ID"
          autoComplete="off"
        />
      </label>
      <label className="field">
        Note (optional)
        <input name="note" maxLength={500} autoComplete="off" />
      </label>
      {message && (
        <p className="form-error" role="alert">
          {message}
        </p>
      )}
      <div className="form-actions">
        <button className="button button-primary" disabled={busy}>
          {busy ? "Recording…" : "Mark as paid"}
        </button>
      </div>
    </form>
  );
}
