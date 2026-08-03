"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n";
import type { BackendAppointment } from "@/features/appointments/data/backend-appointment-repository";
import type { BackendArrival } from "../data/backend-arrival-repository";
import type { ArrivalMessages } from "./messages";
export function iraqDateTime(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: "Asia/Baghdad",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
export function ArrivalWorkspace({
  appointment,
  initialArrival,
  locale,
  m,
}: {
  appointment: BackendAppointment;
  initialArrival: BackendArrival;
  locale: Locale;
  m: ArrivalMessages;
}) {
  const router = useRouter(),
    dialog = useRef<HTMLDialogElement>(null),
    opener = useRef<HTMLButtonElement>(null),
    announcement = useRef<HTMLParagraphElement>(null),
    attempt = useRef<string | null>(null),
    [arrival, setArrival] = useState(initialArrival),
    [pending, setPending] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    if (message) announcement.current?.focus();
  }, [message]);
  async function record() {
    if (pending || arrival.status !== "expected") return;
    setPending(true);
    setMessage("");
    const isRetry = attempt.current !== null;
    attempt.current ??= crypto.randomUUID();
    try {
      const response = await fetch(
          `/api/appointments/${appointment.id}/arrival`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              version: arrival.version,
              operationId: attempt.current,
            }),
          },
        ),
        data = (await response.json()) as {
          arrival?: BackendArrival;
          error?: { code?: string };
        };
      if (response.ok && data.arrival) {
        setArrival(data.arrival);
        setMessage(isRetry ? m.replay : m.success);
        attempt.current = null;
        dialog.current?.close();
        router.refresh();
      } else {
        const code = data.error?.code ?? "";
        setMessage(
          response.status === 401
            ? m.unauthorized
            : response.status === 403
              ? m.forbidden
              : response.status === 404
                ? m.notFound
                : response.status === 400
                  ? m.validation
                  : response.status === 409
                    ? code.includes("WINDOW")
                      ? m.outsideWindow
                      : code.includes("STATE")
                        ? m.invalidState
                        : m.conflict
                    : response.status === 503
                      ? code.includes("AUDIT")
                        ? m.auditFailure
                        : m.backendError
                      : m.backendError,
        );
      }
    } catch {
      setMessage(m.offline);
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="arrival-workspace">
      <Link
        className="back-link"
        href={`/${locale}/appointments/${appointment.id}`}
      >
        {m.back}
      </Link>
      <header className="heading">
        <p className="eyebrow">{m.arrival}</p>
        <h1>{m.title}</h1>
        <p>{m.subtitle}</p>
      </header>
      <section className="section" aria-labelledby="arrival-summary">
        <h2 id="arrival-summary">{m.arrivalStatus}</h2>
        <dl className="clinical-detail-grid">
          <Row label={m.patient} value={appointment.patientName} />
          <Row label={m.doctor} value={appointment.doctorName} />
          <Row label={m.clinic} value={appointment.clinicName} />
          <Row
            label={m.appointmentTime}
            value={iraqDateTime(appointment.startsAt, locale)}
          />
          <Row label={m.appointmentStatus} value={appointment.status} />
          <Row label={m.arrivalStatus} value={m[arrival.status]} />
          <Row label={m.version} value={String(arrival.version)} />
          {arrival.arrivedAt && (
            <Row
              label={m.arrivedAt}
              value={iraqDateTime(arrival.arrivedAt, locale)}
            />
          )}{" "}
          {arrival.queueReadyAt && (
            <Row
              label={m.queueReadyAt}
              value={iraqDateTime(arrival.queueReadyAt, locale)}
            />
          )}
        </dl>
        <p>{m.queueSeparate}</p>
        {arrival.status === "expected" &&
          !["cancelled", "completed", "noShow"].includes(
            appointment.status,
          ) && (
            <button
              ref={opener}
              className="primary"
              onClick={() => {
                setMessage("");
                dialog.current?.showModal();
              }}
            >
              {m.record}
            </button>
          )}
        <p ref={announcement} role="status" aria-live="polite" tabIndex={-1}>
          {message}
        </p>
      </section>
      <dialog
        ref={dialog}
        aria-labelledby="arrival-confirm-title"
        onCancel={(event) => {
          if (pending) event.preventDefault();
        }}
        onClose={() => opener.current?.focus()}
      >
        <h2 id="arrival-confirm-title">{m.confirmTitle}</h2>
        <p>{m.confirmBody}</p>
        <div className="row-actions">
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!pending) dialog.current?.close();
            }}
          >
            {m.cancel}
          </button>
          <button type="button" disabled={pending} onClick={record}>
            {pending ? m.pending : m.confirm}
          </button>
        </div>
      </dialog>
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
