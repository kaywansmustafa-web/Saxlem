"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { BackendAppointment } from "../data/backend-appointment-repository";
import type { ClinicalMessages } from "@/features/clinical-presentation/messages";
import { iraqLocalDateTimeToOffset } from "../domain/appointment-filter-contract";

export function AppointmentMutations({
  appointment,
  m,
}: {
  appointment: BackendAppointment;
  m: ClinicalMessages;
}) {
  const router = useRouter(),
    dialog = useRef<HTMLDialogElement>(null),
    opener = useRef<HTMLButtonElement | null>(null),
    [mode, setMode] = useState<"cancel" | "reschedule">("cancel"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const open = (
    next: typeof mode,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    opener.current = event.currentTarget;
    setMode(next);
    setMessage("");
    dialog.current?.showModal();
  };
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget),
      localStart =
        mode === "reschedule"
          ? iraqLocalDateTimeToOffset(String(form.get("startsAt")))
          : null;
    if (mode === "reschedule" && !localStart) {
      setMessage(m.validation);
      return;
    }
    setBusy(true);
    setMessage("");
    const body =
      mode === "cancel"
        ? {
            reason: String(form.get("reason") ?? ""),
            version: appointment.version,
            operationId: crypto.randomUUID(),
          }
        : {
            startsAt: localStart!,
            durationMinutes: Number(form.get("durationMinutes")),
            version: appointment.version,
            operationId: crypto.randomUUID(),
          };
    try {
      const response = await fetch(
        `/api/appointments/${appointment.id}/${mode}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (response.ok) {
        setMessage(m.success);
        dialog.current?.close();
        router.refresh();
      } else
        setMessage(
          response.status === 409
            ? m.conflict
            : response.status === 400
              ? m.validation
              : m.backendError,
        );
    } catch {
      setMessage(m.offline);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="section">
      <h2>{m.actions}</h2>
      <div className="row-actions">
        <button onClick={(event) => open("reschedule", event)}>
          {m.reschedule}
        </button>
        <button onClick={(event) => open("cancel", event)}>{m.cancel}</button>
      </div>
      <p role="status" aria-live="polite">
        {message}
      </p>
      <dialog
        ref={dialog}
        aria-labelledby="mutation-title"
        onCancel={(event) => {
          if (busy) event.preventDefault();
        }}
        onClose={() => {
          setBusy(false);
          opener.current?.focus();
        }}
      >
        <form onSubmit={submit}>
          <h2 id="mutation-title">
            {mode === "cancel" ? m.cancelTitle : m.rescheduleTitle}
          </h2>
          {mode === "cancel" ? (
            <>
              <p>{m.cancelHelp}</p>
              <label>
                {m.reason}
                <textarea
                  name="reason"
                  minLength={1}
                  maxLength={500}
                  required
                  autoFocus
                />
              </label>
            </>
          ) : (
            <>
              <label>
                {m.startsAt}
                <input
                  name="startsAt"
                  type="datetime-local"
                  required
                  autoFocus
                />
              </label>
              <label>
                {m.minutes}
                <input
                  name="durationMinutes"
                  type="number"
                  min="5"
                  max="480"
                  defaultValue={appointment.durationMinutes}
                  required
                />
              </label>
            </>
          )}
          <div className="row-actions">
            <button
              type="button"
              disabled={busy}
              onClick={() => dialog.current?.close()}
            >
              {m.close}
            </button>
            <button disabled={busy} type="submit">
              {busy ? m.saving : m.confirmAction}
            </button>
          </div>
        </form>
      </dialog>
    </section>
  );
}
