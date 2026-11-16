"use client";
import { useRef, useState } from "react";

export function FinalizeStatement({
  statement,
}: {
  statement: {
    id: string;
    version: number;
    periodStart: string;
    periodEnd: string;
    grossEarnedIqd: number;
    reversalsIqd: number;
    netCommissionIqd: number;
    qualifyingCount: number;
    reversalCount: number;
  };
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const close = () => {
    if (!busy) {
      dialog.current?.close();
      trigger.current?.focus();
    }
  };
  return (
    <>
      <button
        ref={trigger}
        className="button button-secondary"
        onClick={() => dialog.current?.showModal()}
      >
        Finalize
      </button>
      <dialog
        ref={dialog}
        onCancel={(event) => {
          if (busy) event.preventDefault();
        }}
        onClose={() => {
          if (!busy) trigger.current?.focus();
        }}
      >
        <section className="dialog-content">
          <h2>Finalize statement?</h2>
          <p>
            After this the statement can no longer change. It does not settle or
            transfer money.
          </p>
          <dl>
            <dt>Period</dt>
            <dd>
              {new Date(statement.periodStart).toLocaleDateString("en-IQ")} –{" "}
              {new Date(statement.periodEnd).toLocaleDateString("en-IQ")}
            </dd>
            <dt>Gross</dt>
            <dd>{statement.grossEarnedIqd.toLocaleString("en-IQ")} IQD</dd>
            <dt>Reversals</dt>
            <dd>{statement.reversalsIqd.toLocaleString("en-IQ")} IQD</dd>
            <dt>Net</dt>
            <dd>{statement.netCommissionIqd.toLocaleString("en-IQ")} IQD</dd>
            <dt>Lines</dt>
            <dd>{statement.qualifyingCount + statement.reversalCount}</dd>
          </dl>
          {message && <p role="alert">{message}</p>}
          <div className="dialog-actions">
            <button
              className="button button-tertiary"
              disabled={busy}
              onClick={close}
            >
              Cancel
            </button>
            <button
              className="button button-primary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setMessage("");
                try {
                  const response = await fetch("/api/platform/finalize", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                      statementId: statement.id,
                      version: statement.version,
                    }),
                  });
                  const result = (await response.json()) as {
                    ok?: boolean;
                    error?: { message?: string };
                  };
                  if (!response.ok || !result.ok)
                    throw new Error(
                      result.error?.message ?? "Finalization failed.",
                    );
                  dialog.current?.close();
                  window.location.reload();
                } catch (error) {
                  setMessage(
                    error instanceof Error
                      ? error.message
                      : "Finalization failed.",
                  );
                  setBusy(false);
                }
              }}
            >
              {busy ? "Finalizing…" : "Finalize permanently"}
            </button>
          </div>
        </section>
      </dialog>
    </>
  );
}
