"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/i18n";
import type { QueueSummary, StaffEntry } from "@/features/live-queue/data/backend-queue-repository";
import type { BackendAppointmentStatus } from "@/features/appointments/data/backend-appointment-repository";
import { Icon } from "@/components/icons";
import { formatter } from "@/lib/format";
import { workdayMessages } from "./messages";
import { Greeting, LiveChip, OriginChip, StatusChip } from "./parts";

export interface DoctorDay {
  readonly doctorId: string;
  readonly doctorName: string;
  readonly freeLater: number;
  readonly appointments: readonly {
    id: string;
    startsAt: string;
    patientName: string;
    origin: "patientBooked" | "clinicCreated" | "walkIn";
    status: BackendAppointmentStatus;
  }[];
  readonly queue: QueueSummary | null;
  readonly entries: readonly StaffEntry[];
}

/** Reception's home: the whole day for their doctors on one screen, live. */
export function ReceptionToday({ locale, timeZone, days }: { locale: Locale; timeZone: string; days: readonly DoctorDay[] }) {
  const m = workdayMessages(locale),
    f = useMemo(() => formatter(locale, timeZone), [locale, timeZone]),
    router = useRouter(),
    [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const refresh = setInterval(() => router.refresh(), 20_000),
      tick = setInterval(() => setNow(new Date()), 30_000);
    return () => {
      clearInterval(refresh);
      clearInterval(tick);
    };
  }, [router]);

  const all = days.flatMap((d) => d.appointments),
    live = all.filter((a) => a.status !== "cancelled"),
    stats = {
      booked: live.length,
      waiting: days.reduce((sum, d) => sum + (d.queue?.waitingCount ?? 0), 0),
      seen: all.filter((a) => a.status === "completed").length,
      free: days.reduce((sum, d) => sum + d.freeLater, 0),
    };

  return (
    <div className="ax-page">
      <header className="ax-hero">
        <div>
          <p className="ax-eyebrow">{f.weekdayDay(now)}</p>
          <h1 className="ax-title">
            <Greeting m={m} timeZone={timeZone} />
          </h1>
          <p className="ax-lead">{m.receptionTitle}</p>
        </div>
        <div className="ax-hero-side">
          <LiveChip label={m.live} hint={m.updatedEvery} />
        </div>
      </header>

      <nav className="ax-quick" aria-label={m.receptionTitle}>
        <Link className="ax-quick-item is-primary" href={`/${locale}/appointments/new`}>
          <Icon name="plus" />
          <span>{m.newBooking}</span>
        </Link>
        <Link className="ax-quick-item" href={`/${locale}/appointments/board`}>
          <Icon name="calendar" />
          <span>{m.openBoard}</span>
        </Link>
        <Link className="ax-quick-item" href={`/${locale}/live-queue`}>
          <Icon name="queue" />
          <span>{m.liveQueue}</span>
        </Link>
        <Link className="ax-quick-item" href={`/${locale}/patients`}>
          <Icon name="search" />
          <span>{m.findPatient}</span>
        </Link>
      </nav>

      <div className="ax-stats">
        <div className="ax-stat">
          <strong>{stats.booked}</strong>
          <span>{m.booked}</span>
        </div>
        <div className="ax-stat is-brand">
          <strong>{stats.waiting}</strong>
          <span>{m.waiting}</span>
        </div>
        <div className="ax-stat is-ok">
          <strong>{stats.seen}</strong>
          <span>{m.seen}</span>
        </div>
        <div className="ax-stat">
          <strong>{stats.free}</strong>
          <span>{m.freeSlots}</span>
        </div>
      </div>

      {days.length === 0 && (
        <div className="ax-card ax-empty ax-empty-lg">
          <h3>{m.noDoctors}</h3>
        </div>
      )}

      <div className="ax-doctor-days">
        {days.map((day) => {
          const current = day.queue?.currentPatient ?? null,
            waiting = day.entries.filter((e) => e.status === "waiting"),
            queued = new Set(day.entries.map((e) => e.appointmentId)),
            next = day.appointments
              .filter(
                (a) =>
                  (a.status === "scheduled" || a.status === "confirmed") &&
                  !queued.has(a.id) &&
                  new Date(a.startsAt).getTime() > now.getTime() - 45 * 60_000,
              )
              .slice(0, 5);
          return (
            <section key={day.doctorId} className="ax-card ax-doctor-day" aria-label={day.doctorName}>
              <div className="ax-card-head">
                <div className="ax-doctor-name">
                  <span className="ax-avatar ax-avatar-sm" aria-hidden="true">
                    {day.doctorName.replace(/^Dr\.?\s*/i, "").slice(0, 1)}
                  </span>
                  <h2 className="ax-card-title">{day.doctorName}</h2>
                </div>
                <span className={`ax-chip ${day.queue?.status === "open" ? "is-ok" : day.queue?.status === "paused" ? "is-warn" : "is-muted"}`}>
                  {day.queue?.status === "open" ? m.queueOpen : day.queue?.status === "paused" ? m.queuePaused : m.queueClosed}
                </span>
              </div>

              <div className="ax-doctor-now">
                <div className="ax-mini-panel">
                  <span className="ax-mini-label">{m.inRoom}</span>
                  {current ? (
                    <div className="ax-row">
                      <span className="ax-ticket-sm is-live">{current.ticketNumber}</span>
                      <span className="ax-row-main">
                        <strong>{current.patientDisplayName}</strong>
                        <small>{current.status === "inConsultation" ? m.inConsultation : m.calledShort}</small>
                      </span>
                    </div>
                  ) : (
                    <p className="ax-muted">{m.nobodyInRoom}</p>
                  )}
                </div>
                <div className="ax-mini-panel">
                  <span className="ax-mini-label">
                    {m.waitingList} · {waiting.length}
                  </span>
                  {waiting.length === 0 ? (
                    <p className="ax-muted">{m.nobodyWaiting}</p>
                  ) : (
                    <p className="ax-waiting-names">
                      {waiting.slice(0, 3).map((e) => (
                        <span key={e.entryId}>
                          <b>{e.ticketNumber}</b> {e.patientDisplayName}
                        </span>
                      ))}
                      {waiting.length > 3 && <span>+{waiting.length - 3}</span>}
                    </p>
                  )}
                </div>
              </div>

              <div className="ax-card-head ax-gap-top">
                <h3 className="ax-subtitle">{m.nextUp}</h3>
                <Link className="ax-link" href={`/${locale}/live-queue?doctorId=${day.doctorId}`}>
                  {m.liveQueue}
                  <Icon name="arrow" size={16} className="ax-flip" />
                </Link>
              </div>
              {next.length === 0 ? (
                <p className="ax-muted ax-pad">{m.nothingNext}</p>
              ) : (
                <ol className="ax-timeline">
                  {next.map((a) => (
                    <li key={a.id} className="ax-slot ax-slot-action">
                      <time dateTime={a.startsAt}>{f.time(a.startsAt)}</time>
                      <span className="ax-row-main">
                        <strong>{a.patientName}</strong>
                        <small>
                          <OriginChip m={m} origin={a.origin} />
                        </small>
                      </span>
                      <span className="ax-slot-tags">
                        <StatusChip m={m} status={a.status} />
                        <Link className="ax-btn ax-btn-sm" href={`/${locale}/appointments/${a.id}/arrival`}>
                          {m.markArrived}
                        </Link>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
