"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n";
import { formatter } from "@/lib/format";
import { workdayMessages } from "@/features/workday/messages";
import type { DoctorSettingsView } from "../data/backend-doctor-settings";
import {
  BIOGRAPHY_MAX,
  DOCTOR_LANGUAGES,
  FEE_MAX,
  type DoctorLanguage,
  type Period,
  type WeekProblem,
  outside,
  overlapsAny,
  partOfDay,
  toTime,
  weekOrder,
  weekProblem,
  wholeDays,
} from "../domain/week";
import { doctorSettingsMessages, type DoctorSettingsMessages } from "./messages";
import { WeekEditor } from "./week-editor";

type Note = { text: string; error: boolean } | null;
type Sent = { ok: true; json: Record<string, unknown> } | { ok: false; status: number };

async function send(method: "PUT" | "POST" | "DELETE", path: string, body?: unknown): Promise<Sent> {
  try {
    const response = await fetch(`/api/doctor-settings/${path}`, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    return response.ok && json?.ok === true ? { ok: true, json } : { ok: false, status: response.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

/** Words for a failed save; the server never returns its own messages. */
function failure(m: DoctorSettingsMessages, status: number, conflict?: string, invalid?: string) {
  if (status === 403) return m.notYours;
  if (status === 404) return m.notFound;
  if (status === 409 && conflict) return conflict;
  if (status === 400) return invalid ?? m.rejected;
  return m.failed;
}

function Status({ note }: { note: Note }) {
  if (!note) return null;
  return (
    <p role={note.error ? "alert" : "status"} className={note.error ? "ds-note is-error" : "ds-note"}>
      {note.text}
    </p>
  );
}

function problemText(m: DoctorSettingsMessages, weekdays: readonly string[], problem: WeekProblem) {
  switch (problem.kind) {
    case "tooMany":
      return m.tooMany;
    case "steps":
      return m.steps;
    case "order":
      return m.order(weekdays[problem.weekday] ?? "");
    case "overlap":
      return m.overlap(weekdays[problem.weekday] ?? "");
  }
}

/** "Saturday 09:00–13:00, 16:00–20:00 · Sunday …" */
function summary(periods: readonly Period[], weekdays: readonly string[], separator: string) {
  return weekOrder
    .map((day) => {
      const own = periods.filter((p) => p.weekday === day).sort((a, b) => a.startsMinute - b.startsMinute);
      return own.length
        ? `${weekdays[day]} ${own.map((p) => `${toTime(p.startsMinute)}–${toTime(p.endsMinute)}`).join(separator)}`
        : null;
    })
    .filter(Boolean)
    .join(" · ");
}

/** Clinic Portal → Doctors → a doctor: reception runs everything about them. */
export function DoctorSettings({ view, locale }: { view: DoctorSettingsView; locale: Locale }) {
  const m = doctorSettingsMessages(locale);
  const weekdays = workdayMessages(locale).weekdays;
  const f = formatter(locale, view.timezone);
  return (
    <div className="ds-grid">
      <div className="ds-column">
        <HoursCard view={view} m={m} weekdays={weekdays} separator={f.comma} />
        <OpeningCard view={view} m={m} weekdays={weekdays} />
      </div>
      <div className="ds-column">
        <BookingCard view={view} m={m} />
        <TimeOffCard view={view} m={m} locale={locale} />
        <FeesCard view={view} m={m} locale={locale} />
        <ProfileCard view={view} m={m} />
      </div>
    </div>
  );
}

function HoursCard({
  view,
  m,
  weekdays,
  separator,
}: {
  view: DoctorSettingsView;
  m: DoctorSettingsMessages;
  weekdays: readonly string[];
  separator: string;
}) {
  const router = useRouter();
  const [weekly, setWeekly] = useState<Period[]>(() => [...view.weekly]);
  const [breaks, setBreaks] = useState<Period[]>(() => [...view.breaks]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);
  const shape = weekProblem(weekly) ?? weekProblem(breaks);
  const problem = shape
    ? problemText(m, weekdays, shape)
    : outside(view.openingHours, weekly).length
      ? m.outsideClinic
      : outside(weekly, breaks).length
        ? m.breakOutside
        : overlapsAny(weekly, view.elsewhere)
          ? m.elsewhere
          : null;
  return (
    <section className="ax-card ds-card" aria-labelledby="ds-hours">
      <h2 id="ds-hours" className="ax-card-title">
        {m.hoursTitle}
      </h2>
      <p className="ax-muted">{m.hoursLead}</p>
      <p className="ds-open">
        <strong>{m.clinicOpen}:</strong>{" "}
        {view.openingHours.length ? summary(view.openingHours, weekdays, separator) : m.notSet}
      </p>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (problem) return;
          setBusy(true);
          setNote(null);
          const result = await send("PUT", `${view.doctorId}/hours`, { weekly, breaks });
          setBusy(false);
          if (result.ok) {
            setNote({ text: m.hoursSaved, error: false });
            router.refresh();
          } else setNote({ text: failure(m, result.status), error: true });
        }}
      >
        <WeekEditor
          label={m.workingHours}
          periods={weekly}
          onChange={setWeekly}
          idPrefix="ds-w"
          weekdays={weekdays}
          m={m}
          emptyLabel={m.notWorking}
        />
        <WeekEditor
          label={m.breaks}
          periods={breaks}
          onChange={setBreaks}
          idPrefix="ds-b"
          weekdays={weekdays}
          m={m}
          emptyLabel={m.noBreak}
          newPeriod={[780, 840]}
        />
        {problem && (
          <p role="alert" className="ds-note is-error">
            {problem}
          </p>
        )}
        <Status note={note} />
        <button className="ax-btn ax-btn-primary" disabled={busy || !!problem}>
          {busy ? m.saving : m.saveHours}
        </button>
      </form>
    </section>
  );
}

function OpeningCard({
  view,
  m,
  weekdays,
}: {
  view: DoctorSettingsView;
  m: DoctorSettingsMessages;
  weekdays: readonly string[];
}) {
  const router = useRouter();
  const [periods, setPeriods] = useState<Period[]>(() => [...view.openingHours]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);
  const shape = weekProblem(periods);
  const problem = shape ? problemText(m, weekdays, shape) : null;
  return (
    <section className="ax-card ds-card" aria-labelledby="ds-opening">
      <h2 id="ds-opening" className="ax-card-title">
        {m.openingTitle}
      </h2>
      <p className="ax-muted">{m.openingLead}</p>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (problem) return;
          setBusy(true);
          setNote(null);
          const result = await send("PUT", "opening-hours", { periods });
          setBusy(false);
          if (result.ok) {
            setNote({ text: m.saved, error: false });
            router.refresh();
          } else setNote({ text: failure(m, result.status, m.openingStranded), error: true });
        }}
      >
        <WeekEditor
          label={m.openingTitle}
          periods={periods}
          onChange={setPeriods}
          idPrefix="ds-o"
          weekdays={weekdays}
          m={m}
          emptyLabel={m.closed}
          newPeriod={[480, 1260]}
        />
        {problem && (
          <p role="alert" className="ds-note is-error">
            {problem}
          </p>
        )}
        <Status note={note} />
        <button className="ax-btn ax-btn-primary" disabled={busy || !!problem}>
          {busy ? m.saving : m.saveOpening}
        </button>
      </form>
    </section>
  );
}

function BookingCard({ view, m }: { view: DoctorSettingsView; m: DoctorSettingsMessages }) {
  const router = useRouter();
  const [bookable, setBookable] = useState(view.bookable);
  const [newPatients, setNewPatients] = useState(view.acceptingNewPatients);
  const [own, setOwn] = useState(view.visitMinutes !== null);
  const [minutes, setMinutes] = useState(view.visitMinutes ?? view.defaultVisitMinutes);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);
  const bad = own && (!Number.isInteger(minutes) || minutes < 5 || minutes > 240 || minutes % 5 !== 0);
  return (
    <section className="ax-card ds-card" aria-labelledby="ds-booking">
      <h2 id="ds-booking" className="ax-card-title">
        {m.bookingTitle}
      </h2>
      <form
        className="ds-form"
        onSubmit={async (event) => {
          event.preventDefault();
          if (bad) return;
          setBusy(true);
          setNote(null);
          const result = await send("PUT", `${view.doctorId}/booking`, {
            visitMinutes: own ? minutes : null,
            bookable,
            acceptingNewPatients: newPatients,
          });
          setBusy(false);
          if (result.ok) {
            setNote({ text: m.saved, error: false });
            router.refresh();
          } else setNote({ text: failure(m, result.status), error: true });
        }}
      >
        <label className="ds-check">
          <input type="checkbox" checked={bookable} onChange={(e) => setBookable(e.target.checked)} />
          <span>{m.bookable}</span>
        </label>
        <label className="ds-check">
          <input
            type="checkbox"
            checked={newPatients}
            disabled={!bookable}
            onChange={(e) => setNewPatients(e.target.checked)}
          />
          <span>
            {m.newPatients}
            <small>{m.newPatientsHint}</small>
          </span>
        </label>
        <p className="ax-muted ds-hint">{m.phoneAlways}</p>
        <label className="ds-check">
          <input type="checkbox" checked={own} onChange={(e) => setOwn(e.target.checked)} />
          <span>
            {m.ownLength}
            <small>{m.defaultLength(view.defaultVisitMinutes)}</small>
          </span>
        </label>
        {own && (
          <label className="ds-field">
            <span>{m.visitLength}</span>
            <span className="ds-input-unit">
              <input
                type="number"
                inputMode="numeric"
                min={5}
                max={240}
                step={5}
                value={Number.isNaN(minutes) ? "" : minutes}
                aria-invalid={bad || undefined}
                onChange={(e) => setMinutes(e.target.value === "" ? Number.NaN : Number(e.target.value))}
              />
              <span>{m.minutes}</span>
            </span>
          </label>
        )}
        {bad && (
          <p role="alert" className="ds-note is-error">
            {m.lengthProblem}
          </p>
        )}
        <Status note={note} />
        <button className="ax-btn ax-btn-primary" disabled={busy || bad}>
          {busy ? m.saving : m.saveBooking}
        </button>
      </form>
    </section>
  );
}

const midnight = (iso: string, timeZone: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(
    new Date(iso),
  ) === "00:00";

function TimeOffCard({ view, m, locale }: { view: DoctorSettingsView; m: DoctorSettingsMessages; locale: Locale }) {
  const router = useRouter();
  const f = formatter(locale, view.timezone);
  const [mode, setMode] = useState<"days" | "part">("days");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);
  const label = (from: string, to: string) =>
    midnight(from, view.timezone) && midnight(to, view.timezone)
      ? (() => {
          const last = new Date(new Date(to).getTime() - 1);
          const first = f.day(from);
          return first === f.day(last) ? first : `${first} – ${f.day(last)}`;
        })()
      : `${f.dayTime(from)} – ${f.dayTime(to)}`;
  return (
    <section className="ax-card ds-card" aria-labelledby="ds-timeoff">
      <h2 id="ds-timeoff" className="ax-card-title">
        {m.timeOffTitle}
      </h2>
      <p className="ax-muted">{m.timeOffLead}</p>
      {view.leave.length ? (
        <ul className="ds-leave">
          {view.leave.map((leave) => (
            <li key={leave.id}>
              <span>{label(leave.startsAt, leave.endsAt)}</span>
              <button
                type="button"
                className="ds-link"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setNote(null);
                  const result = await send("DELETE", `${view.doctorId}/leave/${leave.id}`);
                  setBusy(false);
                  if (result.ok) router.refresh();
                  else setNote({ text: failure(m, result.status), error: true });
                }}
              >
                {m.remove}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="ds-empty">{m.noTimeOff}</p>
      )}
      <form
        className="ds-form"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const data = new FormData(form);
          const text = (name: string) => String(data.get(name) ?? "");
          const range =
            mode === "days"
              ? wholeDays(text("first"), text("last") || text("first"), view.timezone)
              : partOfDay(text("day"), text("from"), text("until"), view.timezone);
          if (!range) return setNote({ text: m.timeOffInvalid, error: true });
          setBusy(true);
          setNote(null);
          const result = await send("POST", `${view.doctorId}/leave`, range);
          setBusy(false);
          if (!result.ok)
            return setNote({ text: failure(m, result.status, undefined, m.timeOffRejected), error: true });
          const booked = typeof result.json.bookedVisits === "number" ? result.json.bookedVisits : 0;
          setNote({ text: booked ? m.timeOffBooked(booked) : m.timeOffAdded, error: booked > 0 });
          form.reset();
          router.refresh();
        }}
      >
        <div className="ds-segment" role="radiogroup" aria-label={m.timeOffTitle}>
          {(["days", "part"] as const).map((value) => (
            <label key={value} className={mode === value ? "is-on" : ""}>
              <input
                type="radio"
                name="mode"
                value={value}
                checked={mode === value}
                onChange={() => setMode(value)}
              />
              {value === "days" ? m.wholeDays : m.partDay}
            </label>
          ))}
        </div>
        {mode === "days" ? (
          <div className="ds-row">
            <label className="ds-field">
              <span>{m.firstDay}</span>
              <input type="date" name="first" required />
            </label>
            <label className="ds-field">
              <span>{m.lastDay}</span>
              <input type="date" name="last" />
            </label>
          </div>
        ) : (
          <div className="ds-row">
            <label className="ds-field">
              <span>{m.day}</span>
              <input type="date" name="day" required />
            </label>
            <label className="ds-field">
              <span>{m.from}</span>
              <input type="time" name="from" step={300} required />
            </label>
            <label className="ds-field">
              <span>{m.until}</span>
              <input type="time" name="until" step={300} required />
            </label>
          </div>
        )}
        <Status note={note} />
        <button className="ax-btn" disabled={busy}>
          {busy ? m.saving : m.addTimeOff}
        </button>
      </form>
    </section>
  );
}

function FeeChoice({
  name,
  legend,
  usualLabel,
  own,
  amount,
  onOwn,
  onAmount,
  m,
}: {
  name: string;
  legend: string;
  usualLabel: string;
  own: boolean;
  amount: number;
  onOwn: (own: boolean) => void;
  onAmount: (value: number) => void;
  m: DoctorSettingsMessages;
}) {
  return (
    <fieldset className="ds-fee">
      <legend>{legend}</legend>
      <label className="ds-check">
        <input type="radio" name={name} checked={!own} onChange={() => onOwn(false)} />
        <span>{usualLabel}</span>
      </label>
      <label className="ds-check">
        <input type="radio" name={name} checked={own} onChange={() => onOwn(true)} />
        <span>{m.ownFee}</span>
      </label>
      {own && (
        <span className="ds-input-unit">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={FEE_MAX}
            step={250}
            aria-label={`${legend}, ${m.ownFee}`}
            value={Number.isNaN(amount) ? "" : amount}
            onChange={(e) => onAmount(e.target.value === "" ? Number.NaN : Number(e.target.value))}
          />
          <span>IQD</span>
        </span>
      )}
    </fieldset>
  );
}

function FeesCard({ view, m, locale }: { view: DoctorSettingsView; m: DoctorSettingsMessages; locale: Locale }) {
  const router = useRouter();
  const f = formatter(locale, view.timezone);
  const [ownFirst, setOwnFirst] = useState(view.consultationFeeIqd !== null);
  const [first, setFirst] = useState(view.consultationFeeIqd ?? view.defaultFeeIqd);
  const [ownFollow, setOwnFollow] = useState(view.followUpFeeIqd !== null);
  const [follow, setFollow] = useState(view.followUpFeeIqd ?? view.consultationFeeIqd ?? view.defaultFeeIqd);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);
  const valid = (value: number) => Number.isInteger(value) && value >= 0 && value <= FEE_MAX;
  const bad = (ownFirst && !valid(first)) || (ownFollow && !valid(follow));
  return (
    <section className="ax-card ds-card" aria-labelledby="ds-fees">
      <h2 id="ds-fees" className="ax-card-title">
        {m.feesTitle}
      </h2>
      <p className="ax-muted">{m.feesLead}</p>
      <form
        className="ds-form"
        onSubmit={async (event) => {
          event.preventDefault();
          if (bad) return;
          setBusy(true);
          setNote(null);
          const result = await send("PUT", `${view.doctorId}/details`, {
            consultationFeeIqd: ownFirst ? first : null,
            followUpFeeIqd: ownFollow ? follow : null,
          });
          setBusy(false);
          if (result.ok) {
            setNote({ text: m.saved, error: false });
            router.refresh();
          } else setNote({ text: failure(m, result.status), error: true });
        }}
      >
        <FeeChoice
          name="fee-first"
          legend={m.firstVisit}
          usualLabel={m.usual(f.iqd(view.defaultFeeIqd))}
          own={ownFirst}
          amount={first}
          onOwn={setOwnFirst}
          onAmount={setFirst}
          m={m}
        />
        <FeeChoice
          name="fee-follow-up"
          legend={m.followUp}
          usualLabel={m.sameAsFirst}
          own={ownFollow}
          amount={follow}
          onOwn={setOwnFollow}
          onAmount={setFollow}
          m={m}
        />
        {bad && (
          <p role="alert" className="ds-note is-error">
            {m.feeProblem}
          </p>
        )}
        <Status note={note} />
        <button className="ax-btn ax-btn-primary" disabled={busy || bad}>
          {busy ? m.saving : m.saveFees}
        </button>
      </form>
    </section>
  );
}

function ProfileCard({ view, m }: { view: DoctorSettingsView; m: DoctorSettingsMessages }) {
  const router = useRouter();
  const [biography, setBiography] = useState(view.biography);
  const [years, setYears] = useState(view.yearsOfExperience);
  const [languages, setLanguages] = useState<Set<DoctorLanguage>>(
    () => new Set(view.languages.filter((x): x is DoctorLanguage => (DOCTOR_LANGUAGES as readonly string[]).includes(x))),
  );
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);
  const problem =
    biography.trim().length > BIOGRAPHY_MAX
      ? m.biographyProblem
      : !Number.isInteger(years) || years < 0 || years > 80
        ? m.yearsProblem
        : languages.size === 0
          ? m.languagesProblem
          : null;
  return (
    <section className="ax-card ds-card" aria-labelledby="ds-profile">
      <h2 id="ds-profile" className="ax-card-title">
        {m.profileTitle}
      </h2>
      <form
        className="ds-form"
        onSubmit={async (event) => {
          event.preventDefault();
          if (problem) return;
          setBusy(true);
          setNote(null);
          const result = await send("PUT", `${view.doctorId}/details`, {
            biography: biography.trim(),
            yearsOfExperience: years,
            languages: DOCTOR_LANGUAGES.filter((x) => languages.has(x)),
          });
          setBusy(false);
          if (result.ok) {
            setNote({ text: m.saved, error: false });
            router.refresh();
          } else setNote({ text: failure(m, result.status), error: true });
        }}
      >
        <label className="ds-field">
          <span>{m.biography}</span>
          <textarea
            rows={5}
            maxLength={BIOGRAPHY_MAX}
            value={biography}
            aria-describedby="ds-bio-hint"
            onChange={(e) => setBiography(e.target.value)}
          />
          <small id="ds-bio-hint">{m.biographyHint}</small>
        </label>
        <label className="ds-field ds-narrow">
          <span>{m.years}</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={80}
            value={Number.isNaN(years) ? "" : years}
            onChange={(e) => setYears(e.target.value === "" ? Number.NaN : Number(e.target.value))}
          />
        </label>
        <fieldset className="ds-fee">
          <legend>{m.languages}</legend>
          <div className="ds-chips">
            {DOCTOR_LANGUAGES.map((language) => (
              <label key={language} className={languages.has(language) ? "is-on" : ""}>
                <input
                  type="checkbox"
                  checked={languages.has(language)}
                  onChange={() =>
                    setLanguages((current) => {
                      const next = new Set(current);
                      if (next.has(language)) next.delete(language);
                      else next.add(language);
                      return next;
                    })
                  }
                />
                {m.languageNames[language]}
              </label>
            ))}
          </div>
        </fieldset>
        {problem && (
          <p role="alert" className="ds-note is-error">
            {problem}
          </p>
        )}
        <Status note={note} />
        <button className="ax-btn ax-btn-primary" disabled={busy || !!problem}>
          {busy ? m.saving : m.saveProfile}
        </button>
      </form>
    </section>
  );
}
