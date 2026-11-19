"use client";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n";
import { formatter } from "@/lib/format";
import {
  clockFormat,
  dayFormat,
  type BookingMessages,
} from "./booking-messages";

type Mode = "phone" | "walkIn";
type VisitType = "initial" | "followUp";
interface Patient {
  readonly id: string;
  readonly name: string;
}
interface Doctor {
  readonly id: string;
  readonly displayName: string;
}
interface Slot {
  readonly startsAt: string;
  readonly endsAt: string;
  readonly durationMinutes: number;
}
interface SearchItem {
  readonly patientProfileId: string;
  readonly displayName: string;
  readonly nextAppointmentAt: string | null;
}

const post = async (path: string, body: unknown) => {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await response.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  return {
    status: response.status,
    ok: response.ok && json?.ok === true,
    json,
  };
};

/**
 * Reception books a phone call or a walk-in. Slots come from the same
 * calendar the Saxlem app reads, and the database refuses any overlap, so
 * app and desk bookings can never collide.
 */
export function NewBooking({
  mode,
  doctors,
  today,
  timezone,
  locale,
  m,
  preset,
}: {
  /** Doctor, day and time chosen on the day board. */
  preset?: { doctorId?: string; date?: string; startsAt?: string };
  mode: Mode;
  doctors: readonly Doctor[];
  today: string;
  timezone: string;
  locale: Locale;
  m: BookingMessages;
}) {
  const router = useRouter();
  const walkIn = mode === "walkIn";
  const [patient, setPatient] = useState<Patient | null>(null);
  const [patientMode, setPatientMode] = useState<"search" | "new">("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<readonly SearchItem[] | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    gender: "unspecified" as "female" | "male" | "unspecified",
  });
  const [doctorId, setDoctorId] = useState(
    preset?.doctorId && doctors.some((item) => item.id === preset.doctorId)
      ? preset.doctorId
      : doctors.length === 1
        ? doctors[0]!.id
        : "",
  );
  const [type, setType] = useState<VisitType>("initial");
  const [date, setDate] = useState(
    !walkIn && preset?.date && preset.date >= today ? preset.date : today,
  );
  const [slots, setSlots] = useState<readonly Slot[] | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [reason, setReason] = useState(walkIn ? m.walkInReason : "");
  const [busy, setBusy] = useState<
    "search" | "patient" | "slots" | "book" | null
  >(null);
  const [error, setError] = useState("");
  const operation = useRef<string>("");

  const time = useMemo(() => clockFormat(locale, timezone), [locale, timezone]);
  const dates = useMemo(() => formatter(locale, timezone), [locale, timezone]);
  // The next seven clinic days, today first.
  const week = useMemo(
    () =>
      Array.from({ length: 7 }, (_, offset) => {
        const at = new Date(`${today}T00:00:00.000Z`);
        at.setUTCDate(at.getUTCDate() + offset);
        return at.toISOString().slice(0, 10);
      }),
    [today],
  );
  const doctor = doctors.find((item) => item.id === doctorId);

  const search = async () => {
    if (query.trim().length < 2) return;
    setBusy("search");
    setError("");
    try {
      const result = await post("/api/patients/search", {
        query: query.trim(),
      });
      const page = result.json?.page as { items?: SearchItem[] } | undefined;
      if (!result.ok || !page?.items) setError(m.failed);
      else setResults(page.items);
    } catch {
      setError(m.failed);
    } finally {
      setBusy(null);
    }
  };

  const register = async () => {
    setBusy("patient");
    setError("");
    try {
      const result = await post("/api/patients/register", form);
      const saved = result.json?.patient as
        { patientProfileId: string; displayName: string } | undefined;
      if (result.status === 400) setError(m.invalidPhone);
      else if (!result.ok || !saved) setError(m.failed);
      else
        choosePatient({ id: saved.patientProfileId, name: saved.displayName });
    } catch {
      setError(m.failed);
    } finally {
      setBusy(null);
    }
  };

  // Slots reload whenever a choice that affects them changes; the handlers
  // pass the new value because state updates are not visible until render.
  const loadSlots = async (
    next: Partial<{
      patient: Patient | null;
      doctorId: string;
      type: VisitType;
      date: string;
    }> = {},
  ) => {
    const chosen = {
      patient: next.patient === undefined ? patient : next.patient,
      doctorId: next.doctorId ?? doctorId,
      type: next.type ?? type,
      date: next.date ?? date,
    };
    if (!chosen.patient || !chosen.doctorId) {
      setSlots(null);
      setSlot(null);
      return;
    }
    setBusy("slots");
    setSlots(null);
    setSlot(null);
    try {
      const result = await post("/api/appointments/slots", {
        doctorId: chosen.doctorId,
        patientProfileId: chosen.patient.id,
        type: chosen.type,
        date: chosen.date,
      });
      const day = result.json?.day as { slots?: Slot[] } | undefined;
      if (!result.ok || !day?.slots) {
        setError(m.failed);
        return;
      }
      // A walk-in is seen now, so only times starting within the hour count.
      const offered = walkIn
        ? day.slots.filter(
            (item) =>
              new Date(item.startsAt).getTime() - Date.now() <= 3_600_000,
          )
        : day.slots;
      setSlots(offered);
      // The time picked on the day board wins; otherwise a walk-in takes
      // the next free time. Reception can still pick another.
      const held = offered.find((item) => item.startsAt === preset?.startsAt);
      if (held) setSlot(held);
      else if (walkIn && offered[0]) setSlot(offered[0]);
    } catch {
      setError(m.failed);
    } finally {
      setBusy(null);
    }
  };
  const choosePatient = (value: Patient) => {
    setPatient(value);
    void loadSlots({ patient: value });
  };

  const book = async () => {
    if (!patient || !doctorId || !slot || !reason.trim()) return;
    operation.current ||= crypto.randomUUID();
    setBusy("book");
    setError("");
    try {
      const result = await post("/api/appointments/book", {
        doctorId,
        patientProfileId: patient.id,
        type,
        reason: reason.trim(),
        startsAt: slot.startsAt,
        durationMinutes: slot.durationMinutes,
        walkIn,
        operationId: operation.current,
      });
      const appointment = result.json?.appointment as
        { id: string } | undefined;
      if (result.status === 409) {
        operation.current = "";
        setError(m.taken);
        setBusy(null);
        await loadSlots();
        return;
      }
      if (!result.ok || !appointment) {
        setError(result.status === 400 && walkIn ? m.noSlotsToday : m.failed);
        setBusy(null);
        return;
      }
      router.push(`/${locale}/appointments/${appointment.id}`);
    } catch {
      setError(m.failed);
      setBusy(null);
    }
  };

  const step = (n: number, title: string, done: boolean) => (
    <header className="booking-step-head">
      <span className={`booking-step-index${done ? " done" : ""}`}>
        {done ? "✓" : n}
      </span>
      <h2>{title}</h2>
    </header>
  );

  return (
    <div className="booking-flow">
      {preset?.startsAt && doctor && !patient && (
        <p className="booking-held">
          {m.holding
            .replace("{time}", time.format(new Date(preset.startsAt)))
            .replace("{doctor}", doctor.displayName)}
        </p>
      )}
      {error && (
        <p className="booking-alert" role="alert">
          {error}
        </p>
      )}

      <section className="booking-step" aria-labelledby="step-patient">
        {step(1, m.stepPatient, !!patient)}
        {patient ? (
          <div className="booking-chosen">
            <strong id="step-patient">{patient.name}</strong>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setPatient(null);
                setSlots(null);
                setSlot(null);
              }}
            >
              {m.change}
            </button>
          </div>
        ) : (
          <>
            <div className="booking-toggle" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={patientMode === "search"}
                onClick={() => setPatientMode("search")}
              >
                {m.existingPatient}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={patientMode === "new"}
                onClick={() => setPatientMode("new")}
              >
                {m.newPatient}
              </button>
            </div>
            {patientMode === "search" ? (
              <>
                <form
                  className="booking-search"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void search();
                  }}
                >
                  <label>
                    {m.searchLabel}
                    <input
                      type="text"
                      id="step-patient"
                      value={query}
                      placeholder={m.searchPlaceholder}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={busy === "search" || query.trim().length < 2}
                  >
                    {busy === "search" ? m.searching : m.search}
                  </button>
                </form>
                {results &&
                  (results.length ? (
                    <ul className="booking-choices">
                      {results.map((item) => (
                        <li key={item.patientProfileId}>
                          <button
                            type="button"
                            onClick={() =>
                              choosePatient({
                                id: item.patientProfileId,
                                name: item.displayName,
                              })
                            }
                          >
                            {item.displayName}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="booking-muted">{m.noMatches}</p>
                  ))}
              </>
            ) : (
              <form
                className="booking-new-patient"
                onSubmit={(event) => {
                  event.preventDefault();
                  void register();
                }}
              >
                <label>
                  {m.firstName}
                  <input
                    type="text"
                    id="step-patient"
                    required
                    maxLength={80}
                    value={form.firstName}
                    onChange={(event) =>
                      setForm({ ...form, firstName: event.target.value })
                    }
                  />
                </label>
                <label>
                  {m.lastName}
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={form.lastName}
                    onChange={(event) =>
                      setForm({ ...form, lastName: event.target.value })
                    }
                  />
                </label>
                <label>
                  {m.phone}
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    inputMode="tel"
                    autoComplete="off"
                    placeholder="0750 123 4567"
                    maxLength={20}
                    value={form.phoneNumber}
                    onChange={(event) =>
                      setForm({ ...form, phoneNumber: event.target.value })
                    }
                  />
                </label>
                <label>
                  {m.gender}
                  <select
                    value={form.gender}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        gender: event.target.value as typeof form.gender,
                      })
                    }
                  >
                    <option value="unspecified">{m.unspecified}</option>
                    <option value="female">{m.female}</option>
                    <option value="male">{m.male}</option>
                  </select>
                </label>
                <p className="booking-muted">{m.noAppHint}</p>
                <button type="submit" disabled={busy === "patient"}>
                  {busy === "patient" ? m.saving : m.savePatient}
                </button>
              </form>
            )}
          </>
        )}
      </section>

      <section
        className="booking-step"
        aria-labelledby="step-doctor"
        data-disabled={!patient || undefined}
      >
        {step(2, m.stepDoctor, !!doctor && !!patient)}
        {doctors.length ? (
          <>
            <div className="booking-grid">
              {doctors.length === 1 ? (
                <div className="booking-field">
                  <span id="step-doctor" className="booking-label">
                    {m.stepDoctor}
                  </span>
                  <p className="booking-fixed">{doctors[0]!.displayName}</p>
                </div>
              ) : (
                <label>
                  <span id="step-doctor">{m.chooseDoctor}</span>
                  <select
                    disabled={!patient}
                    value={doctorId}
                    onChange={(event) => {
                      setDoctorId(event.target.value);
                      void loadSlots({ doctorId: event.target.value });
                    }}
                  >
                    <option value="">-</option>
                    {doctors.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.displayName}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <div className="booking-field">
                <span id="visit-type" className="booking-label">
                  {m.visitType}
                </span>
                <div
                  className="ax-segment"
                  role="radiogroup"
                  aria-labelledby="visit-type"
                >
                  {(["initial", "followUp"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={type === value}
                      disabled={!patient}
                      onClick={() => {
                        setType(value);
                        void loadSlots({ type: value });
                      }}
                    >
                      {value === "initial" ? m.initial : m.followUp}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {!walkIn && (
              <div className="booking-field">
                <span id="booking-day" className="booking-label">
                  {m.day}
                </span>
                <div
                  className="ax-choice booking-days"
                  role="radiogroup"
                  aria-labelledby="booking-day"
                >
                  {week.map((value, index) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={date === value}
                      className="ax-choice-item booking-day"
                      disabled={!patient}
                      onClick={() => {
                        setDate(value);
                        void loadSlots({ date: value });
                      }}
                    >
                      <small>
                        {index === 0
                          ? m.today
                          : dates.weekdayShort(`${value}T12:00:00Z`)}
                      </small>
                      <strong>{dates.dayNoYear(`${value}T12:00:00Z`)}</strong>
                    </button>
                  ))}
                  <label className="booking-other-day">
                    <span className="visually-hidden">{m.otherDay}</span>
                    <input
                      type="date"
                      title={m.otherDay}
                      disabled={!patient}
                      min={today}
                      value={week.includes(date) ? "" : date}
                      onChange={(event) => {
                        if (!event.target.value) return;
                        setDate(event.target.value);
                        void loadSlots({ date: event.target.value });
                      }}
                    />
                  </label>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="booking-muted">{m.noDoctors}</p>
        )}
      </section>

      <section
        className="booking-step"
        aria-labelledby="step-time"
        data-disabled={!patient || !doctor || undefined}
      >
        {step(3, m.stepTime, !!slot)}
        <span id="step-time" className="visually-hidden">
          {m.stepTime}
        </span>
        {busy === "slots" && (
          <p className="booking-muted" role="status">
            {m.loadingSlots}
          </p>
        )}
        {slots &&
          (slots.length ? (
            <>
              {walkIn && slots[0] && (
                <p className="booking-next">
                  {m.nextFree}:{" "}
                  <strong>{time.format(new Date(slots[0].startsAt))}</strong>
                </p>
              )}
              <div className="slot-grid" role="radiogroup">
                {slots.map((item) => (
                  <button
                    key={item.startsAt}
                    type="button"
                    role="radio"
                    aria-checked={slot?.startsAt === item.startsAt}
                    className="slot"
                    onClick={() => setSlot(item)}
                  >
                    {time.format(new Date(item.startsAt))}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="booking-muted">
              {walkIn ? m.noSlotsToday : m.noSlots}
            </p>
          ))}
      </section>

      <section
        className="booking-step"
        aria-labelledby="step-confirm"
        data-disabled={!slot || undefined}
      >
        {step(4, m.stepConfirm, false)}
        <label>
          <span id="step-confirm">{m.reason}</span>
          <input
            type="text"
            disabled={!slot}
            maxLength={500}
            placeholder={m.reasonPlaceholder}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </label>
        {slot && patient && doctor && (
          <p className="booking-summary">
            {m.summary
              .replace("{patient}", patient.name)
              .replace("{doctor}", doctor.displayName)
              .replace(
                "{time}",
                dayFormat(locale, timezone, true).format(
                  new Date(slot.startsAt),
                ),
              )}
          </p>
        )}
        <button
          type="button"
          className="primary booking-confirm"
          disabled={!slot || !reason.trim() || busy === "book"}
          onClick={() => void book()}
        >
          {busy === "book"
            ? m.booking
            : walkIn
              ? m.confirmWalkIn
              : m.confirmPhone}
        </button>
      </section>
    </div>
  );
}
