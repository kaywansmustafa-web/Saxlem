"use client";
import { formatter } from "@/lib/format";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ticket } from "@/features/workday/parts";
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
  const selected = doctors.find((x) => x.id === doctorId),
    f = formatter(locale, queue?.effectiveTimezone ?? "Asia/Baghdad"),
    current = queue?.currentPatient ?? null,
    rows = [...entries]
      .filter((e) => e.entryId !== current?.entryId)
      .sort((a, b) => rank(a.status) - rank(b.status)),
    waitingRows = rows.filter((e) => rank(e.status) === 0).length,
    destructive = confirmation?.body.operation === "close";
  return (
    <div className="ax-page">
      <header className="ax-hero">
        <div>
          <p className="ax-eyebrow">{m.title}</p>
          <h1 className="ax-title">{selected?.displayName ?? m.title}</h1>
          {queue && (
            <p className="ax-lead">
              {m.updated} {f.time(queue.updatedAt)}
            </p>
          )}
        </div>
        {queue && (
          <div className="ax-hero-side">
            <span
              className={`ax-chip ${queue.status === "open" ? "is-ok" : queue.status === "paused" ? "is-warn" : "is-muted"}`}
            >
              {m[queue.status]}
            </span>
          </div>
        )}
      </header>
      {doctors.length > 1 && (
        <nav className="ax-choice" aria-label={m.selectDoctor}>
          {doctors.map((d) => (
            <Link
              key={d.id}
              className="ax-choice-item"
              href={`/${locale}/live-queue?doctorId=${d.id}`}
              aria-current={d.id === doctorId ? "true" : undefined}
            >
              {d.displayName}
            </Link>
          ))}
        </nav>
      )}
      {!doctorId && (
        <section className="ax-card">
          <div className="ax-empty ax-empty-lg">
            <span className="ax-empty-icon" aria-hidden="true">
              <QueueIcon />
            </span>
            <p>{m.chooseHint}</p>
          </div>
        </section>
      )}
      {doctorId && !queue ? (
        <section className="ax-card">
          <div className="ax-empty ax-empty-lg">
            <span className="ax-empty-icon" aria-hidden="true">
              <QueueIcon />
            </span>
            <h2>{m.noQueue}</h2>
            <button
              className="ax-btn ax-btn-primary ax-btn-lg"
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
          </div>
        </section>
      ) : null}
      {queue ? (
        <>
          <section
            className="ax-card ax-queue-now"
            aria-labelledby="queue-now-title"
          >
            <h2 id="queue-now-title" className="ax-card-title">
              {m.current}
            </h2>
            {current ? (
              <div className="ax-current">
                <Ticket
                  number={current.ticketNumber}
                  label={m.ticket}
                  pulse={current.status === "called"}
                />
                <div className="ax-current-body">
                  <h3>{current.patientDisplayName}</h3>
                  <p
                    className={`ax-chip ${current.status === "inConsultation" ? "is-brand" : "is-warn"}`}
                  >
                    {label(current.status, m)}
                  </p>
                  {current.status === "called" && (
                    <div className="ax-actions">
                      <EntryActions
                        entry={current}
                        queue={queue}
                        m={m}
                        busy={busy}
                        ask={ask}
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="ax-muted ax-pad">{m.nobodyWithDoctor}</p>
            )}
            <div className="ax-actions ax-queue-actions">
              {queue.status === "open" && (
                <button
                  className="ax-btn ax-btn-primary ax-btn-lg"
                  disabled={busy || !queue.waitingCount || !!current}
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
              )}
              {queue.status === "paused" && (
                <button
                  className="ax-btn ax-btn-primary ax-btn-lg"
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
              {queue.status === "open" && (
                <button
                  className="ax-btn"
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
              )}
              <button
                className="ax-btn ax-btn-ghost"
                disabled={busy}
                onClick={() => router.refresh()}
              >
                {m.refresh}
              </button>
              {queue.status === "open" && (
                <button
                  className="ax-btn ax-btn-danger ax-push-end"
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
              )}
            </div>
            {appointmentId && (
              <div className="ax-alert ax-gap-top">
                <p>{m.queueSeparate}</p>
                <button
                  className="ax-btn ax-btn-primary"
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
            <p
              ref={statusRef}
              className="ax-hint"
              role="status"
              aria-live="polite"
              tabIndex={-1}
            >
              {message}
            </p>
          </section>
          <section className="ax-card" aria-labelledby="queue-waiting-title">
            <div className="ax-card-head">
              <h2 id="queue-waiting-title" className="ax-card-title">
                {m.waiting}
              </h2>
              <span className="ax-count">{waitingRows}</span>
            </div>
            {rows.length === 0 ? (
              <p className="ax-muted ax-pad">{m.nobodyWaiting}</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">{m.ticket}</th>
                      <th scope="col">{m.patient}</th>
                      <th scope="col">{m.entryStatus}</th>
                      <th scope="col">{m.enqueuedAt}</th>
                      <th scope="col">{m.appointmentReference}</th>
                      <th scope="col">
                        <span className="ax-sr">{m.status}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((e) => (
                      <tr
                        key={e.entryId}
                        className={rank(e.status) > 1 ? "is-done" : undefined}
                      >
                        <td>
                          <span className="ax-ticket-sm">{e.ticketNumber}</span>
                        </td>
                        <td>
                          <strong>{e.patientDisplayName}</strong>
                        </td>
                        <td>
                          <span className={`ax-chip ${tone(e.status)}`}>
                            {label(e.status, m)}
                          </span>
                        </td>
                        <td>{f.time(e.enqueuedAt)}</td>
                        <td className="ax-muted">{e.appointmentReference}</td>
                        <td>
                          {e.status === "called" ? (
                            <span className="ax-row-actions">
                              <EntryActions
                                entry={e}
                                queue={queue}
                                m={m}
                                busy={busy}
                                ask={ask}
                              />
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {nextCursor && (
              <nav
                className="ax-actions ax-actions-center ax-gap-top"
                aria-label={m.next}
              >
                <button
                  className="ax-btn"
                  disabled={pageBusy}
                  onClick={loadMore}
                >
                  {m.next}
                </button>
              </nav>
            )}
            <p className="ax-hint" role="status" aria-live="polite">
              {pageError}
            </p>
          </section>
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
                  {operationLabel(confirmation.body.operation, m)}
                </h2>
                <p id="queue-confirm-description">
                  {destructive ? m.closeWarning : m.confirmDescription}
                </p>
                <div className="row-actions">
                  <button
                    className="ax-btn ax-btn-ghost"
                    disabled={busy}
                    onClick={cancelConfirmation}
                  >
                    {m.cancel}
                  </button>
                  <button
                    className={`ax-btn ${destructive ? "ax-btn-danger" : "ax-btn-primary"}`}
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

function EntryActions({
  entry,
  queue,
  m,
  busy,
  ask,
}: {
  entry: StaffEntry;
  queue: QueueSummary;
  m: ProductionQueueMessages;
  busy: boolean;
  ask: (body: Record<string, unknown>, trigger: HTMLButtonElement) => void;
}) {
  const ids = {
    queueId: queue.id,
    entryId: entry.entryId,
    sessionVersion: queue.version,
    entryVersion: entry.version,
  };
  return (
    <>
      <button
        className="ax-btn ax-btn-sm"
        disabled={busy}
        onClick={(event) =>
          ask({ operation: "recall", ...ids }, event.currentTarget)
        }
      >
        {m.recall}
      </button>
      <button
        className="ax-btn ax-btn-sm ax-btn-ghost"
        disabled={busy}
        onClick={(event) =>
          ask({ operation: "no-response", ...ids }, event.currentTarget)
        }
      >
        {m.noResponse}
      </button>
    </>
  );
}

function QueueIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="28"
      height="28"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 6h10M4 12h16M4 18h7" />
      <circle cx="19" cy="6" r="2" />
    </svg>
  );
}

/** Waiting and called first, finished last. */
function rank(s: StaffEntry["status"]) {
  return s === "called" || s === "waiting" ? 0 : s === "inConsultation" ? 1 : 2;
}
function tone(s: StaffEntry["status"]) {
  return s === "waiting"
    ? "is-soft"
    : s === "called"
      ? "is-warn"
      : s === "inConsultation"
        ? "is-brand"
        : s === "completed"
          ? "is-ok"
          : s === "noResponse"
            ? "is-bad"
            : "is-muted";
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
