"use client";

import { useState } from "react";
import Link from "next/link";

export function ActivationForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [complete, setComplete] = useState(false);

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setMessage("");
        const data = new FormData(event.currentTarget);
        try {
          const response = await fetch("/api/activation", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              activationCredential: data.get("activationCredential"),
              password: data.get("password"),
            }),
          });
          const result = (await response.json()) as {
            ok?: boolean;
            error?: { message?: string };
          };
          if (!response.ok || !result.ok)
            throw new Error(result.error?.message ?? "Activation failed.");
          setComplete(true);
          setMessage("Your account is active. You can now sign in securely.");
        } catch (error) {
          setMessage(
            error instanceof Error ? error.message : "Activation failed.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="field">
        One-time activation credential
        <input
          name="activationCredential"
          autoComplete="one-time-code"
          required
          minLength={32}
          maxLength={256}
          disabled={complete}
        />
      </label>
      <label className="field">
        Create password
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          maxLength={256}
          disabled={complete}
        />
      </label>
      {message && <p role={complete ? "status" : "alert"}>{message}</p>}
      {complete ? (
        <Link className="button button-primary inline-button" href="/login">
          Continue to sign in
        </Link>
      ) : (
        <button className="button button-primary" disabled={busy}>
          {busy ? "Activating…" : "Activate account"}
        </button>
      )}
    </form>
  );
}
