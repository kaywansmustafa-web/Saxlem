"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/i18n";
import type { BackendAppointment } from "@/features/appointments/data/backend-appointment-repository";
import type { QueueSummary, StaffEntry } from "@/features/live-queue/data/backend-queue-repository";
import { formatter } from "@/lib/format";
import { workdayMessages } from "./messages";
import { Greeting, LiveChip, OriginChip, StatusChip, Ticket } from "./parts";

type Command =
  | { operation: "open" }
  | { operation: "pause" | "resume" | "call-next"; queueId: string; version: number }
  | {
      operation: "start-consultation" | "complete-consultation";
      queueId: string;
      entryId: string;
      sessionVersion: number;
      entryVersion: number;
    };

export function DoctorDesk({
  locale,
  doctorName,
  specialty,
  clinicName,
  timeZone,
  appointments,
  queue,
  entries,
}: {
  locale: Locale;
  doctorName: string;
  specialty?: string | null;
  clinicName: string;
  timeZone: string;
  appointments: readonly BackendAppointment[];
  queue: QueueSummary | null;
  entries: readonly StaffEntry[];
}) {
  const m = workdayMessages(locale),
    f = useMemo(() => formatter(locale, timeZone), [locale, timeZone]),
    router = useRouter(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null),
    [now, setNow] = useState(() => new Date());

  // Stay live: re-read the queue every 20 s and keep elapsed minutes current.
  useEffect(() => {
    const refresh = setInterval(() => router.refresh(), 20_000),
      tick = setInterval(() => setNow(new Date()), 30_000);
    return () => {
      clearInterval(refresh);
      clearInterval(tick);
    };
  }, [router]);

  const run = async (command: Command) => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/doctor/queue", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ operationId: crypto.randomUUID(), ...command }),
      });
      if (!response.ok) setError(response.status === 409 ? m.stale : m.failed);
    } catch {
      setError(m.failed);
    } finally {
      router.refresh();
      setBusy(false);
    }
  };

  const current = queue?.currentPatient ?? null,
    waiting = entries.filter((entry) => entry.status === "waiting"),
    active = appointments.filter((a) => a.status !== "cancelled"),
    seen = appointments.filter((a) => a.status === "completed").length,
    queued = new Map(
      entries
        .filter((entry) => ["waiting", "called", "inConsultation"].includes(entry.status))
        .map((entry) => [entry.appointmentId, entry.status] as const),
    );

  return (
    <div className="ax-page">
      <header className="ax-hero">
        <div>
          <p className="ax-eyebrow">{f.weekdayDay(now)}</p>
          <h1 className="ax-title">
            <Greeting m={m} timeZone={timeZone} />
            {f.comma}
            {doctorName}
          </h1>
          <p className="ax-lead">
            {clinicName}
            {specialty ? ` · ${specialty}` : ""}
          </p>
        </div>
        <div className="ax-hero-side">
          <LiveChip label={m.live} hint={m.updatedEvery} />
          <span className={`ax-chip ${queue?.status === "open" ? "is-ok" : queue?.status === "paused" ? "is-warn" : "is-muted"}`}>
            {queue?.status === "open" ? m.queueOpen : queue?.status === "paused" ? m.queuePaused : m.queueClosed}
          </span>
        </div>
      </header>

      <div className="ax-stats">
        <Stat label={m.booked} value={active.length} />
        <Stat label={m.waiting} value={queue?.waitingCount ?? 0} tone="brand" />
        <Stat label={m.seen} value={seen} tone="ok" />
        <Stat label={m.noShows} value={appointments.filter((a) => a.status === "noShow").length} />
      </div>

      {error && (
        <p className="ax-alert" role="alert">
          {error}
        </p>
      )}

      <div className="ax-desk">
        <section className="ax-card ax-now" aria-labelledby="now-title">
          <h2 id="now-title" className="ax-card-title">
            {m.nowSeeing}
          </h2>
          {!queue ? (
            <div className="ax-empty ax-empty-lg">
              <span className="ax-empty-icon" aria-hidden="true">
                <QueueIcon />
              </span>
              <h3>{m.queueNotOpenTitle}</h3>
              <p>{m.queueNotOpenBody}</p>
              <button className="ax-btn ax-btn-primary ax-btn-lg" disabled={busy} onClick={() => void run({ operation: "open" })}>
                {busy ? m.busy : m.openQueue}
              </button>
            </div>
          ) : current ? (
            <div className="ax-current">
              <Ticket number={current.ticketNumber} label={m.ticket} pulse={current.status === "called"} />
              <div className="ax-current-body">
                <h3>{current.patientDisplayName}</h3>
                <p className={`ax-chip ${current.status === "inConsultation" ? "is-brand" : "is-warn"}`}>
                  {current.status === "inConsultation" ? m.inConsultation : m.called}
                  {" · "}
                  {m.minutes(
                    f.minutesBetween(
                      current.status === "inConsultation"
                        ? (current.consultationStartedAt ?? current.calledAt ?? current.enqueuedAt)
                        : (current.calledAt ?? current.enqueuedAt),
                      now,
                    ),
                  )}
                </p>
                <div className="ax-actions">
                  {current.status === "called" && (
                    <button
                      className="ax-btn ax-btn-primary ax-btn-lg"
                      disabled={busy}
                      onClick={() =>
                        void run({
                          operation: "start-consultation",
                          queueId: queue.id,
                          entryId: current.entryId,
                          sessionVersion: queue.version,
                          entryVersion: current.version,
                        })
                      }
                    >
                      {m.startConsultation}
                    </button>
                  )}
                  {current.status === "inConsultation" && (
                    <button
                      className="ax-btn ax-btn-primary ax-btn-lg"
                      disabled={busy}
                      onClick={() =>
                        void run({
                          operation: "complete-consultation",
                          queueId: queue.id,
                          entryId: current.entryId,
                          sessionVersion: queue.version,
                          entryVersion: current.version,
                        })
                      }
                    >
                      {m.finish}
                    </button>
                  )}
                  <PauseButton m={m} queue={queue} busy={busy} run={run} />
                </div>
              </div>
            </div>
          ) : (
            <div className="ax-empty">
              <span className="ax-empty-icon" aria-hidden="true">
                <QueueIcon />
              </span>
              <h3>{queue.status === "paused" ? m.queuePaused : m.readyNext}</h3>
              <p>{queue.status === "paused" ? m.pausedNote : m.peopleWaiting(queue.waitingCount)}</p>
              <div className="ax-actions ax-actions-center">
                {queue.status === "open" && (
                  <button
                    className="ax-btn ax-btn-primary ax-btn-lg"
                    disabled={busy || queue.waitingCount === 0}
                    onClick={() => void run({ operation: "call-next", queueId: queue.id, version: queue.version })}
                  >
                    {m.callNext}
                  </button>
                )}
                <PauseButton m={m} queue={queue} busy={busy} run={run} />
              </div>
            </div>
          )}
          {queue && current?.status === "inConsultation" && queue.waitingCount > 0 && (
            <p className="ax-hint">{m.peopleWaiting(queue.waitingCount)}</p>
          )}
        </section>

        <section className="ax-card ax-waiting" aria-labelledby="waiting-title">
          <div className="ax-card-head">
            <h2 id="waiting-title" className="ax-card-title">
              {m.waitingList}
            </h2>
            <span className="ax-count">{waiting.length}</span>
          </div>
          {waiting.length === 0 ? (
            <p className="ax-muted ax-pad">{m.nobodyWaiting}</p>
          ) : (
            <ol className="ax-list">
              {waiting.map((entry, index) => (
                <li key={entry.entryId} className={`ax-row ${index === 0 ? "is-next" : ""}`}>
                  <span className="ax-ticket-sm">{entry.ticketNumber}</span>
                  <span className="ax-row-main">
                    <strong>{entry.patientDisplayName}</strong>
                    <small>
                      {f.time(entry.enqueuedAt)} · {m.minutes(f.minutesBetween(entry.enqueuedAt, now))}
                    </small>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <aside className="ax-card ax-agenda" aria-labelledby="agenda-title">
          <div className="ax-card-head">
            <h2 id="agenda-title" className="ax-card-title">
              {m.todaysAppointments}
            </h2>
            <span className="ax-muted">{m.appointmentsCount(active.length)}</span>
          </div>
          {appointments.length === 0 ? (
            <p className="ax-muted ax-pad">{m.noAppointments}</p>
          ) : (
            <ol className="ax-timeline">
              {appointments.map((appointment) => (
                <li
                  key={appointment.id}
                  className={`ax-slot ${appointment.status === "cancelled" ? "is-cancelled" : ""} ${new Date(appointment.endsAt) < now ? "is-past" : ""}`}
                >
                  <time dateTime={appointment.startsAt}>{f.time(appointment.startsAt)}</time>
                  <span className="ax-row-main">
                    <strong>{appointment.patientName}</strong>
                    <small>
                      {appointment.type === "followUp" ? m.followUp : m.firstVisit}
                      {appointment.reason ? ` · ${appointment.reason}` : ""}
                    </small>
                  </span>
                  <span className="ax-slot-tags">
                    <OriginChip m={m} origin={appointment.origin} />
                    {queued.get(appointment.id) && appointment.status !== "completed" ? (
                      <span className={`ax-chip ${queued.get(appointment.id) === "waiting" ? "is-warn" : "is-brand"}`}>
                        {queued.get(appointment.id) === "waiting"
                          ? m.waitingList
                          : queued.get(appointment.id) === "called"
                            ? m.calledShort
                            : m.inConsultation}
                      </span>
                    ) : (
                      <StatusChip m={m} status={appointment.status} />
                    )}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>
    </div>
  );
}

function PauseButton({
  m,
  queue,
  busy,
  run,
}: {
  m: ReturnType<typeof workdayMessages>;
  queue: QueueSummary;
  busy: boolean;
  run: (command: Command) => Promise<void>;
}) {
  if (queue.status !== "open" && queue.status !== "paused") return null;
  const paused = queue.status === "paused";
  return (
    <button
      className={`ax-btn ${paused ? "ax-btn-primary ax-btn-lg" : "ax-btn-ghost"}`}
      disabled={busy}
      onClick={() => void run({ operation: paused ? "resume" : "pause", queueId: queue.id, version: queue.version })}
    >
      {paused ? m.resume : m.pause}
    </button>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "brand" | "ok" }) {
  return (
    <div className={`ax-stat ${tone ? `is-${tone}` : ""}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function QueueIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="7" r="3" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M19 4.5a3 3 0 0 1 0 5M5 4.5a3 3 0 0 0 0 5" opacity=".5" />
    </svg>
  );
}
