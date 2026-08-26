"use client";

import { useState } from "react";

export function CreateForm({
  kind,
  organizations = [],
}: {
  kind: "organization" | "clinic";
  organizations?: readonly { id: string; name: string }[];
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <form
      className="card"
      style={{ padding: 24, maxWidth: 680 }}
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setMessage("");
        const data = Object.fromEntries(new FormData(event.currentTarget));
        try {
          const response = await fetch(`/api/administration/${kind}`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(data),
          });
          const result = (await response.json()) as {
            ok?: boolean;
            error?: { message?: string };
          };
          if (!response.ok || !result.ok)
            throw new Error(
              result.error?.message ?? "The record could not be created.",
            );
          window.location.assign(
            kind === "organization" ? "/organizations" : "/clinics",
          );
        } catch (error) {
          setMessage(
            error instanceof Error
              ? error.message
              : "The record could not be created.",
          );
          setBusy(false);
        }
      }}
    >
      {kind === "clinic" && (
        <div className="field">
          <label htmlFor="organizationId">Organization</label>
          <select
            id="organizationId"
            name="organizationId"
            required
            defaultValue=""
          >
            <option value="" disabled>
              Choose an organization
            </option>
            {organizations.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="field">
        <label htmlFor="name">
          {kind === "organization" ? "Organization" : "Clinic"} name
        </label>
        <input id="name" name="name" required minLength={1} maxLength={120} />
      </div>
      {kind === "clinic" && (
        <>
          <div className="field">
            <label htmlFor="code">Clinic code</label>
            <input
              id="code"
              name="code"
              required
              minLength={2}
              maxLength={32}
              pattern="[A-Za-z0-9][A-Za-z0-9_-]*"
            />
          </div>
          <div className="field">
            <label htmlFor="timezone">Timezone</label>
            <input
              id="timezone"
              name="timezone"
              required
              defaultValue="Asia/Baghdad"
              maxLength={100}
            />
          </div>
        </>
      )}
      {message && (
        <p className="form-error" role="alert">
          {message}
        </p>
      )}
      <button
        className="button button-primary"
        disabled={busy}
        style={{ marginTop: 22 }}
      >
        {busy ? "Creating..." : `Create ${kind}`}
      </button>
    </form>
  );
}
