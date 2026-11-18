"use client";

import { useEffect, useState } from "react";
import type { BackendAppointment } from "@/features/appointments/data/backend-appointment-repository";
import type { WorkdayMessages } from "./messages";

/** Greeting by the clinic's local hour (rendered after mount to avoid a server/client mismatch). */
export function Greeting({ m, timeZone }: { m: WorkdayMessages; timeZone: string }) {
  const [hour, setHour] = useState<number | null>(null);
  useEffect(() => {
    const read = () =>
      setHour(Number(new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", hourCycle: "h23" }).format(new Date())));
    read();
    const timer = setInterval(read, 600_000);
    return () => clearInterval(timer);
  }, [timeZone]);
  if (hour === null) return <>{m.today}</>;
  return <>{hour < 12 ? m.goodMorning : hour < 17 ? m.goodAfternoon : m.goodEvening}</>;
}

export function LiveChip({ label, hint }: { label: string; hint: string }) {
  return (
    <span className="ax-chip is-live" title={hint}>
      <i aria-hidden="true" />
      {label}
    </span>
  );
}

export function OriginChip({ m, origin }: { m: WorkdayMessages; origin?: BackendAppointment["origin"] }) {
  const kind = origin === "walkIn" ? "walkin" : origin === "clinicCreated" ? "phone" : "app";
  return (
    <span className={`ax-chip is-${kind}`}>
      {kind === "walkin" ? m.walkInShort : kind === "phone" ? m.phone : m.app}
    </span>
  );
}

export function StatusChip({ m, status }: { m: WorkdayMessages; status: BackendAppointment["status"] }) {
  const tone =
    status === "completed" ? "is-ok" : status === "noShow" ? "is-bad" : status === "cancelled" ? "is-muted" : "is-soft";
  const label =
    status === "completed"
      ? m.statusCompleted
      : status === "noShow"
        ? m.statusNoShow
        : status === "cancelled"
          ? m.statusCancelled
          : status === "confirmed"
            ? m.statusConfirmed
            : m.statusScheduled;
  return <span className={`ax-chip ${tone}`}>{label}</span>;
}

/** The ticket number inside the aura ring: the one thing a doctor glances at. */
export function Ticket({ number, label, pulse = false }: { number: number; label: string; pulse?: boolean }) {
  return (
    <div className={`ax-ring ${pulse ? "is-pulsing" : ""}`} role="img" aria-label={`${label} ${number}`}>
      <span className="ax-ring-label">{label}</span>
      <strong>{number}</strong>
    </div>
  );
}
