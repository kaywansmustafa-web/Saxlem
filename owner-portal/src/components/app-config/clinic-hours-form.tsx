"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { type Period, outside, summary, weekProblem, weekdayNames, toTime } from "@/domain/week";
import { send } from "./send";
import { WeekEditor } from "./week-editor";

/** Clinic → Opening hours. Doctors' hours must fit inside them. */
export function ClinicHoursForm({
  clinicId,
  periods,
  doctorPeriods,
}: {
  clinicId: string;
  periods: Period[];
  doctorPeriods: (Period & { doctorName: string })[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Period[]>(periods);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const stranded = outside(draft, doctorPeriods) as (Period & { doctorName: string })[];
  const problem =
    weekProblem(draft, "hours") ??
    (stranded.length
      ? `These doctors would work outside the new hours: ${[...new Set(stranded.map((p) => p.doctorName))].join(", ")} (${stranded
          .slice(0, 3)
          .map((p) => `${weekdayNames[p.weekday]} ${toTime(p.startsMinute)}–${toTime(p.endsMinute)}`)
          .join(", ")}). Change their hours first.`
      : null);
  return (
    <form
      className="card detail-card hours-card"
      onSubmit={async (event) => {
        event.preventDefault();
        if (problem) return;
        setBusy(true);
        setMessage(null);
        const result = await send("PUT", `clinics/${clinicId}/hours`, { periods: draft });
        setBusy(false);
        if (result.ok) {
          setMessage({ text: "Opening hours saved.", error: false });
          router.refresh();
        } else setMessage({ text: result.message, error: true });
      }}
    >
      <h2>Opening hours</h2>
      <p className="muted">
        When the clinic is open, in clinic time. Each doctor&rsquo;s hours (on the doctor&rsquo;s page) must sit inside
        these. Now: {summary(periods)}.
      </p>
      <WeekEditor label="Open" periods={draft} onChange={setDraft} idPrefix={`open-${clinicId}`} newPeriod={[480, 1260]} />
      {problem && (
        <p role="alert" className="form-error">
          {problem}
        </p>
      )}
      {message && (
        <p role={message.error ? "alert" : "status"} className={message.error ? "form-error" : "muted"}>
          {message.text}
        </p>
      )}
      <button className="button button-primary" disabled={busy || !!problem}>
        {busy ? "Saving…" : "Save opening hours"}
      </button>
    </form>
  );
}
