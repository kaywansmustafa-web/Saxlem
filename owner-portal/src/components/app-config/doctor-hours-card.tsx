"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DoctorHours } from "@/data/app-catalog";
import { type Period, clinicTime, localToIso, outside, summary, weekProblem } from "@/domain/week";
import { send } from "./send";
import { WeekEditor } from "./week-editor";

type Message = { text: string; error: boolean } | null;
const Note = ({ message }: { message: Message }) =>
  message ? (
    <p role={message.error ? "alert" : "status"} className={message.error ? "form-error" : "muted"}>
      {message.text}
    </p>
  ) : null;

/** Owner Portal → doctor → Hours: everything booking needs about a doctor. */
export function DoctorHoursCard({ hours }: { hours: DoctorHours }) {
  const firstZone = hours.clinics[0]?.timezone ?? "Asia/Baghdad";
  return (
    <section className="card detail-card hours-card" aria-labelledby="hours-title">
      <h2 id="hours-title">Hours and booking</h2>
      <p className="muted">
        Patients can book only inside these hours. The doctor&apos;s receptionist can also change all of this in the
        Clinic Portal. Next free time:{" "}
        <strong>
          {hours.nextAvailableAt ? clinicTime(hours.nextAvailableAt, firstZone) : "none in the booking window"}
        </strong>
        .
      </p>
      <BookingForm hours={hours} />
      {hours.clinics.map((clinic) => (
        <ClinicWeek key={clinic.clinicId} doctorId={hours.doctorId} clinic={clinic} all={hours.clinics} />
      ))}
      {hours.clinics.length === 0 && <p className="muted">This doctor has no clinic yet.</p>}
      <TimeOff hours={hours} />
    </section>
  );
}

function BookingForm({ hours }: { hours: DoctorHours }) {
  const router = useRouter();
  const [own, setOwn] = useState(hours.visitMinutes !== null);
  const [minutes, setMinutes] = useState(hours.visitMinutes ?? hours.defaultVisitMinutes);
  const [bookable, setBookable] = useState(hours.bookable);
  const [newPatients, setNewPatients] = useState(hours.acceptingNewPatients);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const bad = own && (!Number.isInteger(minutes) || minutes < 5 || minutes > 240 || minutes % 5 !== 0);
  return (
    <form
      className="hours-section"
      onSubmit={async (event) => {
        event.preventDefault();
        if (bad) return;
        setBusy(true);
        setMessage(null);
        const result = await send("PUT", `doctors/${hours.doctorId}/booking`, {
          visitMinutes: own ? minutes : null,
          bookable,
          acceptingNewPatients: newPatients,
        });
        setBusy(false);
        if (result.ok) {
          setMessage({ text: "Saved.", error: false });
          router.refresh();
        } else setMessage({ text: result.message, error: true });
      }}
    >
      <h3>Booking</h3>
      <label className="check-field">
        <input type="checkbox" checked={bookable} onChange={(e) => setBookable(e.target.checked)} />
        Patients can book this doctor in the app
      </label>
      <label className="check-field">
        <input
          type="checkbox"
          checked={newPatients}
          disabled={!bookable}
          onChange={(e) => setNewPatients(e.target.checked)}
        />
        Takes new patients (off: only follow-ups can be booked in the app)
      </label>
      <p className="muted">Reception can always book by phone and add walk-ins.</p>
      <label className="check-field">
        <input type="checkbox" checked={own} onChange={(e) => setOwn(e.target.checked)} />
        Own visit length (otherwise the default, {hours.defaultVisitMinutes} minutes)
      </label>
      {own && (
        <label className="field">
          Visit length
          <span className="setting-input">
            <input
              type="number"
              min={5}
              max={240}
              step={5}
              value={Number.isNaN(minutes) ? "" : minutes}
              aria-invalid={bad || undefined}
              onChange={(e) => setMinutes(e.target.value === "" ? Number.NaN : Number(e.target.value))}
            />
            <span className="muted">minutes</span>
          </span>
        </label>
      )}
      {bad && (
        <p role="alert" className="form-error">
          Use 5 to 240 minutes, in 5-minute steps.
        </p>
      )}
      <Note message={message} />
      <button className="button button-primary" disabled={busy || bad}>
        {busy ? "Saving…" : "Save booking"}
      </button>
    </form>
  );
}

function ClinicWeek({
  doctorId,
  clinic,
  all,
}: {
  doctorId: string;
  clinic: DoctorHours["clinics"][number];
  all: DoctorHours["clinics"];
}) {
  const router = useRouter();
  const [weekly, setWeekly] = useState<Period[]>(clinic.weekly);
  const [breaks, setBreaks] = useState<Period[]>(clinic.breaks);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const others = all.filter((c) => c.clinicId !== clinic.clinicId).flatMap((c) => c.weekly);
  const clash = weekly.some((p) =>
    others.some((o) => o.weekday === p.weekday && o.startsMinute < p.endsMinute && o.endsMinute > p.startsMinute),
  );
  const problem =
    weekProblem(weekly, "hours") ??
    weekProblem(breaks, "breaks") ??
    (outside(clinic.openingHours, weekly).length
      ? `Some hours are outside the clinic's opening hours (${summary(clinic.openingHours)}). Change those on the clinic's page first.`
      : null) ??
    (outside(weekly, breaks).length ? "Every break must sit inside working hours on the same day." : null) ??
    (clash ? "These hours overlap this doctor's hours at another clinic." : null);
  return (
    <form
      className="hours-section"
      onSubmit={async (event) => {
        event.preventDefault();
        if (problem) return;
        setBusy(true);
        setMessage(null);
        const result = await send("PUT", `doctors/${doctorId}/hours/${clinic.clinicId}`, { weekly, breaks });
        setBusy(false);
        if (result.ok) {
          setMessage({ text: "Hours saved. Existing bookings stay as they are.", error: false });
          router.refresh();
        } else setMessage({ text: result.message, error: true });
      }}
    >
      <h3>At {clinic.clinicName}</h3>
      <p className="muted">
        Clinic open: {summary(clinic.openingHours)}
        {clinic.openingHours.length === 0 && " (set the clinic's opening hours first)"}.
      </p>
      <WeekEditor
        label="Working hours"
        periods={weekly}
        onChange={setWeekly}
        idPrefix={`w-${clinic.clinicId}`}
        emptyLabel="Not working"
      />
      <WeekEditor
        label="Breaks"
        periods={breaks}
        onChange={setBreaks}
        idPrefix={`b-${clinic.clinicId}`}
        newPeriod={[780, 840]}
        emptyLabel="No break"
      />
      {problem && (
        <p role="alert" className="form-error">
          {problem}
        </p>
      )}
      <Note message={message} />
      <button className="button button-primary" disabled={busy || !!problem}>
        {busy ? "Saving…" : `Save hours at ${clinic.clinicName}`}
      </button>
    </form>
  );
}

function TimeOff({ hours }: { hours: DoctorHours }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const leave = hours.clinics.flatMap((c) =>
    c.leave.map((l) => ({ ...l, clinicName: c.clinicName, timezone: c.timezone })),
  );
  return (
    <div className="hours-section">
      <h3>Time off</h3>
      {leave.length ? (
        <ul className="time-off-list">
          {leave.map((l) => (
            <li key={l.id}>
              {clinicTime(l.startsAt, l.timezone)} → {clinicTime(l.endsAt, l.timezone)} · {l.clinicName}{" "}
              <button
                type="button"
                className="text-button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  const result = await send("DELETE", `doctors/${hours.doctorId}/leave/${l.id}`);
                  setBusy(false);
                  if (result.ok) router.refresh();
                  else setMessage({ text: result.message, error: true });
                }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">None planned.</p>
      )}
      <form
        className="time-off-form"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const clinicId = String(form.get("clinicId") ?? "");
          const zone = hours.clinics.find((c) => c.clinicId === clinicId)?.timezone ?? hours.clinics[0]?.timezone ?? "Asia/Baghdad";
          const from = String(form.get("from") ?? "");
          const until = String(form.get("until") ?? "");
          if (!from || !until || until <= from) {
            setMessage({ text: "Choose when the time off starts and ends.", error: true });
            return;
          }
          setBusy(true);
          setMessage(null);
          const result = await send("POST", `doctors/${hours.doctorId}/leave`, {
            clinicId: clinicId || null,
            startsAt: localToIso(from, zone),
            endsAt: localToIso(until, zone),
          });
          setBusy(false);
          if (result.ok) {
            const booked = (result.result as { bookedVisits?: number } | null)?.bookedVisits ?? 0;
            setMessage({
              text: booked
                ? `Added. ${booked} booked visit${booked === 1 ? " falls" : "s fall"} in this time: reception should move ${booked === 1 ? "it" : "them"}.`
                : "Added.",
              error: booked > 0,
            });
            event.currentTarget?.reset();
            router.refresh();
          } else setMessage({ text: result.message, error: true });
        }}
      >
        <label className="field">
          From (clinic time)
          <input type="datetime-local" name="from" step={300} required />
        </label>
        <label className="field">
          Until
          <input type="datetime-local" name="until" step={300} required />
        </label>
        {hours.clinics.length > 1 && (
          <label className="field">
            Clinic
            <select name="clinicId" defaultValue="">
              <option value="">Every clinic</option>
              {hours.clinics.map((c) => (
                <option key={c.clinicId} value={c.clinicId}>
                  {c.clinicName}
                </option>
              ))}
            </select>
          </label>
        )}
        <Note message={message} />
        <button className="button button-secondary" disabled={busy || hours.clinics.length === 0}>
          Add time off
        </button>
      </form>
    </div>
  );
}
