"use client";

import { useState } from "react";

export function LoginForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError("");
        const data = new FormData(event.currentTarget);
        try {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              email: data.get("email"),
              password: data.get("password"),
            }),
          });
          const result = (await response.json()) as {
            ok?: boolean;
            returnPath?: string;
            error?: { message?: string };
          };
          if (!response.ok || !result.ok)
            throw new Error(result.error?.message ?? "Sign-in failed.");
          window.location.assign(result.returnPath ?? "/dashboard");
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "Sign-in failed.");
          setBusy(false);
        }
      }}
    >
      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          maxLength={254}
        />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type={show ? "text" : "password"}
          autoComplete="current-password"
          required
          minLength={12}
          maxLength={256}
        />
      </div>
      <button
        type="button"
        className="button button-secondary"
        onClick={() => setShow((value) => !value)}
        aria-pressed={show}
      >
        {show ? "Hide password" : "Show password"}
      </button>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="button button-primary" disabled={busy}>
        {busy ? "Signing in..." : "Sign in securely"}
      </button>
    </form>
  );
}
