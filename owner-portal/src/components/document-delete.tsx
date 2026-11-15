"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export function DocumentDelete({
  id,
  filename,
}: {
  id: string;
  filename: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  function close() {
    if (dialog.current?.open) dialog.current.close();
    trigger.current?.focus();
  }
  return (
    <>
      <button
        ref={trigger}
        className="button button-secondary"
        onClick={() =>
          dialog.current && !dialog.current.open && dialog.current.showModal()
        }
      >
        Delete
      </button>
      <dialog
        ref={dialog}
        onCancel={(event) => (busy ? event.preventDefault() : close())}
      >
        <form
          method="dialog"
          className="dialog-content"
          onSubmit={(event) => event.preventDefault()}
        >
          <h2>Delete document?</h2>
          <p>
            {filename} will become unavailable. The audited metadata record is
            retained.
          </p>
          {message && <p role="alert">{message}</p>}
          <div className="dialog-actions">
            <button
              type="button"
              className="button button-secondary"
              disabled={busy}
              onClick={close}
            >
              Cancel
            </button>
            <button
              type="button"
              className="button button-primary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setMessage("");
                try {
                  const response = await fetch(`/api/documents/${id}`, {
                    method: "DELETE",
                  });
                  const result = (await response.json()) as {
                    ok?: boolean;
                    error?: { message?: string };
                  };
                  if (!response.ok || !result.ok)
                    throw new Error(
                      result.error?.message ?? "Deletion failed.",
                    );
                  if (dialog.current?.open) dialog.current.close();
                  router.refresh();
                } catch (error) {
                  setMessage(
                    error instanceof Error ? error.message : "Deletion failed.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Deleting…" : "Delete document"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
