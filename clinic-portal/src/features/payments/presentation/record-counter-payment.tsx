"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { PaymentMessages } from "./messages";

/** Reception confirms that the patient paid in person. */
export function RecordCounterPayment({
  appointmentId,
  amountLabel,
  m,
}: {
  appointmentId: string;
  amountLabel: string;
  m: PaymentMessages;
}) {
  const router = useRouter(),
    dialog = useRef<HTMLDialogElement>(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const submit = async () => {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(
        `/api/appointments/${appointmentId}/payment/counter`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        },
      );
      if (response.status === 409) {
        setMessage(m.paidInApp);
      } else if (!response.ok) {
        setMessage(m.failed);
      } else {
        dialog.current?.close();
        router.refresh();
        return;
      }
    } catch {
      setMessage(m.failed);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <button
        type="button"
        className="primary"
        onClick={() => {
          setMessage("");
          dialog.current?.showModal();
        }}
      >
        {m.markPaid}
      </button>
      <dialog ref={dialog} aria-labelledby="counter-payment-title">
        <h2 id="counter-payment-title">{m.markPaidTitle}</h2>
        <p>{m.markPaidBody.replace("{amount}", amountLabel)}</p>
        {message && <p role="alert">{message}</p>}
        <div className="row-actions">
          <button type="button" disabled={busy} onClick={submit}>
            {busy ? m.saving : m.confirm}
          </button>
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={() => dialog.current?.close()}
          >
            {m.cancel}
          </button>
        </div>
      </dialog>
    </>
  );
}
