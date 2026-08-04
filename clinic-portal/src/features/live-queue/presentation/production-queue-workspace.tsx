"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n";
import type { QueueDoctor } from "../data/backend-doctor-directory";
import type {
  QueuePage,
  QueueSummary,
  StaffEntry,
} from "../data/backend-queue-repository";
import type { ProductionQueueMessages } from "./production-messages";

type ConfirmationAttempt = Readonly<{
  body: Record<string, unknown>;
  operationId: string;
}>;
export function ProductionQueueWorkspace({
  locale,
  m,
  doctors,
  doctorId,
  queue,
  page,
  appointmentId,
}: {
  locale: Locale;
  m: ProductionQueueMessages;
  doctors: readonly QueueDoctor[];
  doctorId?: string;
  queue?: QueueSummary;
  page?: QueuePage;
  appointmentId?: string;
}) {
  const router = useRouter(),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [entries, setEntries] = useState<readonly StaffEntry[]>(page?.items ?? []),
    [nextCursor, setNextCursor] = useState(page?.nextCursor ?? null),
    [pageBusy, setPageBusy] = useState(false),
    [pageError, setPageError] = useState(""),
    [confirmation, setConfirmation] = useState<ConfirmationAttempt | null>(
      null,
    ),
    dialogRef = useRef<HTMLDialogElement>(null),
    statusRef = useRef<HTMLParagraphElement>(null),
    triggerRef = useRef<HTMLButtonElement | null>(null),
    successfulClose = useRef(false),
    activeQueueId = useRef(queue?.id),
    pageLoading = useRef(false);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (confirmation && dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, [confirmation]);
  async function operate(attempt: ConfirmationAttempt) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/queue/commands", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            ...attempt.body,
            operationId: attempt.operationId,
          }),
        }),
        data = (await response.json()) as {
          result?: { entry?: StaffEntry };
          error?: unknown;
        };
      if (response.ok) {
        setMessage(
          data.result?.entry
            ? `${m.ticketAssigned}: ${data.result.entry.ticketNumber}`
            : m.success,
        );
        successfulClose.current = true;
        dialogRef.current?.close();
        setConfirmation(null);
        router.refresh();
        requestAnimationFrame(() => statusRef.current?.focus());
      } else
        setMessage(
          response.status === 409
            ? m.conflict
            : response.status === 403
              ? m.forbidden
              : response.status === 404
                ? m.notFound
                : response.status === 400
                  ? m.validation
                  : m.backendError,
        );
    } catch {
      setMessage(m.offline);
    } finally {
      setBusy(false);
    }
  }
  function ask(body: Record<string, unknown>, trigger: HTMLButtonElement) {
    if (busy) return;
    triggerRef.current = trigger;
    setConfirmation(Object.freeze({ body, operationId: crypto.randomUUID() }));
  }
  function cancelConfirmation() {
    if (busy) return;
    dialogRef.current?.close();
  }
  async function loadMore() {
    if (pageLoading.current || !nextCursor || !queue) return;
    const expectedQueue = queue.id;
    pageLoading.current = true;
    setPageBusy(true);
    setPageError("");
    try {
      const response = await fetch("/api/queue/entries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ queueId: expectedQueue, cursor: nextCursor }),
      });
      const data = (await response.json()) as { page?: QueuePage };
      if (!response.ok || !data.page) throw new Error("pagination");
      if (activeQueueId.current !== expectedQueue) return;
      setEntries((current) => {
        const unique = new Map(current.map((entry) => [entry.entryId, entry]));
        for (const entry of data.page!.items) unique.set(entry.entryId, entry);
        return [...unique.values()];
      });
      setNextCursor(data.page.nextCursor);
    } catch {
      setPageError(m.paginationError);
    } finally {
      pageLoading.current = false;
      setPageBusy(false);
    }
  }
  const selected = doctors.find((x) => x.id === doctorId);
  return (
    <div>
      <header className="heading">
        <h1>{m.title}</h1>
      </header>
      <form className="clinical-filters">
        <label>
          {m.selectDoctor}
          <select name="doctorId" defaultValue={doctorId ?? ""} required>
            <option value="" disabled>
              {m.selectDoctor}
            </option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.displayName}
              </option>
            ))}
          </select>
        </label>
        <button>{m.choose}</button>
      </form>
      {doctorId && !queue ? (
        <section className="section">
          <h2>{selected?.displayName}</h2>
          <p>{m.noQueue}</p>
          <button
            disabled={busy}
            onClick={(event) =>
              ask(
                { operation: "open", doctorId, version: 1 },
                event.currentTarget,
              )
            }
          >
            {m.openQueue}
          </button>
        </section>
      ) : null}
      {queue ? (
        <>
          <section className="section">
            <h2>{selected?.displayName ?? m.title}</h2>
            <dl className="clinical-detail-grid">
              <Metric l={m.status} v={m[queue.status]} />
              <Metric l={m.waiting} v={String(queue.waitingCount)} />
              <Metric
                l={m.current}
                v={
                  queue.currentPatient
                    ? `${queue.currentPatient.patientDisplayName} · ${queue.currentPatient.ticketNumber}`
                    : m.none
                }
              />
              <Metric
                l={m.updated}
                v={format(queue.updatedAt, locale, queue.effectiveTimezone)}
              />
              <Metric l={m.operationalDate} v={queue.operationalDate} />
              <Metric l={m.timezone} v={queue.effectiveTimezone} />
            </dl>
            <div className="row-actions">
              <button disabled={busy} onClick={() => router.refresh()}>
                {m.refresh}
              </button>
              {queue.status === "open" && (
                <>
                  <button
                    disabled={busy}
                    onClick={(event) =>
                      ask(
                        {
                          operation: "pause",
                          queueId: queue.id,
                          version: queue.version,
                        },
                        event.currentTarget,
                      )
                    }
                  >
                    {m.pause}
                  </button>
                  <button
                    disabled={
                      busy || !queue.waitingCount || !!queue.currentPatient
                    }
                    onClick={(event) =>
                      ask(
                        {
                          operation: "call-next",
                          queueId: queue.id,
                          version: queue.version,
                        },
                        event.currentTarget,
                      )
                    }
                  >
                    {m.callNext}
                  </button>
                  <button
                    disabled={busy}
                    onClick={(event) =>
                      ask(
                        {
                          operation: "close",
                          queueId: queue.id,
                          version: queue.version,
                        },
                        event.currentTarget,
                      )
                    }
                  >
                    {m.close}
                  </button>
                </>
              )}
              {queue.status === "paused" && (
                <button
                  disabled={busy}
                  onClick={(event) =>
                    ask(
                      {
                        operation: "resume",
                        queueId: queue.id,
                        version: queue.version,
                      },
                      event.currentTarget,
                    )
                  }
                >
                  {m.resume}
                </button>
              )}
            </div>
            {appointmentId && (
              <div>
                <p>{m.queueSeparate}</p>
                <button
                  disabled={busy || queue.status !== "open"}
                  onClick={(event) =>
                    ask(
                      {
                        operation: "enqueue",
                        queueId: queue.id,
                        appointmentId,
                        version: queue.version,
                      },
                      event.currentTarget,
                    )
                  }
                >
                  {m.enqueue}
                </button>
              </div>
            )}
            <p ref={statusRef} role="status" aria-live="polite" tabIndex={-1}>
              {message}
            </p>
          </section>
          <EntryTable
            entries={entries}
            queue={queue}
            locale={locale}
            m={m}
            busy={busy}
            ask={ask}
          />
          {nextCursor && (
            <nav aria-label={m.next}>
              <button disabled={pageBusy} onClick={loadMore}>
                {m.next}
              </button>
            </nav>
          )}
          <p role="status" aria-live="polite">
            {pageError}
          </p>
          <dialog
            ref={dialogRef}
            aria-labelledby="queue-confirm-title"
            aria-describedby="queue-confirm-description"
            onCancel={(event) => {
              if (busy) event.preventDefault();
            }}
            onClose={() => {
              if (successfulClose.current) {
                successfulClose.current = false;
                return;
              }
              setConfirmation(null);
              requestAnimationFrame(() => triggerRef.current?.focus());
            }}
          >
            {confirmation ? (
              <>
                <h2 id="queue-confirm-title">
                  {m.confirm}: {operationLabel(confirmation.body.operation, m)}
                </h2>
                <p id="queue-confirm-description">
                  {operationLabel(confirmation.body.operation, m)}.{" "}
                  {m.confirmDescription}
                </p>
                <div className="row-actions">
                  <button disabled={busy} onClick={cancelConfirmation}>
                    {m.cancel}
                  </button>
                  <button
                    disabled={busy}
                    autoFocus
                    onClick={() => operate(confirmation)}
                  >
                    {busy ? m.pending : m.confirm}
                  </button>
                </div>
              </>
            ) : null}
          </dialog>
        </>
      ) : null}
    </div>
  );
}
function EntryTable({
  entries,
  queue,
  locale,
  m,
  busy,
  ask,
}: {
  entries: readonly StaffEntry[];
  queue: QueueSummary;
  locale: Locale;
  m: ProductionQueueMessages;
  busy: boolean;
  ask: (body: Record<string, unknown>, trigger: HTMLButtonElement) => void;
}) {
  return (
    <section className="section">
      <h2>{m.waiting}</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{m.ticket}</th>
              <th>{m.patient}</th>
              <th>{m.appointmentReference}</th>
              <th>{m.entryStatus}</th>
              <th>{m.enqueuedAt}</th>
              <th>{m.status}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.entryId}>
                <td>{e.ticketNumber}</td>
                <td>{e.patientDisplayName}</td>
                <td>{e.appointmentReference}</td>
                <td>{label(e.status, m)}</td>
                <td>{format(e.enqueuedAt, locale, queue.effectiveTimezone)}</td>
                <td>
                  {e.status === "called" ? (
                    <>
                      <button
                        disabled={busy}
                        onClick={(event) =>
                          ask(
                            {
                              operation: "recall",
                              queueId: queue.id,
                              entryId: e.entryId,
                              sessionVersion: queue.version,
                              entryVersion: e.version,
                            },
                            event.currentTarget,
                          )
                        }
                      >
                        {m.recall}
                      </button>
                      <button
                        disabled={busy}
                        onClick={(event) =>
                          ask(
                            {
                              operation: "no-response",
                              queueId: queue.id,
                              entryId: e.entryId,
                              sessionVersion: queue.version,
                              entryVersion: e.version,
                            },
                            event.currentTarget,
                          )
                        }
                      >
                        {m.noResponse}
                      </button>
                    </>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
function Metric({ l, v }: { l: string; v: string }) {
  return (
    <div>
      <dt>{l}</dt>
      <dd>{v}</dd>
    </div>
  );
}
function format(v: string, l: Locale, timeZone: string) {
  return new Intl.DateTimeFormat(l, {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(v));
}
function label(s: StaffEntry["status"], m: ProductionQueueMessages) {
  return s === "waiting"
    ? m.expected
    : s === "called"
      ? m.called
      : s === "inConsultation"
        ? m.inConsultation
        : s === "completed"
          ? m.completed
          : s === "noResponse"
            ? m.noResponseStatus
            : m.removed;
}

function operationLabel(value: unknown, m: ProductionQueueMessages) {
  return value === "open"
    ? m.openQueue
    : value === "enqueue"
      ? m.enqueue
      : value === "pause"
        ? m.pause
        : value === "resume"
          ? m.resume
          : value === "close"
            ? m.close
            : value === "call-next"
              ? m.callNext
              : value === "recall"
                ? m.recall
                : m.noResponse;
}
