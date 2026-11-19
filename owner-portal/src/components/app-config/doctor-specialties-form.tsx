"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { send } from "./send";

/** A doctor's specialties (up to 5) and which one is the main one. */
export function DoctorSpecialtiesForm({
  doctorId,
  current,
  primaryId,
  specialties,
}: {
  doctorId: string;
  current: string[];
  primaryId: string | null;
  specialties: { id: string; nameEn: string }[];
}) {
  const router = useRouter();
  const [chosen, setChosen] = useState<string[]>(current);
  const [primary, setPrimary] = useState<string | null>(primaryId ?? current[0] ?? null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const toggle = (id: string, on: boolean) => {
    const next = on ? [...chosen, id] : chosen.filter((value) => value !== id);
    setChosen(next);
    if (!next.includes(primary ?? "")) setPrimary(next[0] ?? null);
  };
  return (
    <form
      className="card detail-card"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!chosen.length || !primary) return;
        setBusy(true);
        setMessage(null);
        const result = await send("PUT", `doctors/${doctorId}/specialties`, {
          specialtyIds: chosen,
          primarySpecialtyId: primary,
        });
        setBusy(false);
        if (result.ok) {
          setMessage({ text: "Specialties saved.", error: false });
          router.refresh();
        } else setMessage({ text: result.message, error: true });
      }}
    >
      <h2>Specialties</h2>
      <p className="muted">
        Patients find this doctor through these specialties and the Home tiles linked to them. The main one shows on the
        doctor&rsquo;s card.
      </p>
      <fieldset className="field">
        <legend>Specialties (up to 5)</legend>
        <div className="choice-row">
          {specialties.map((s) => (
            <label key={s.id} className="choice">
              <input
                type="checkbox"
                checked={chosen.includes(s.id)}
                disabled={!chosen.includes(s.id) && chosen.length >= 5}
                onChange={(event) => toggle(s.id, event.target.checked)}
              />
              {s.nameEn}
            </label>
          ))}
        </div>
      </fieldset>
      {chosen.length > 1 && (
        <fieldset className="field">
          <legend>Main specialty</legend>
          <div className="choice-row">
            {chosen.map((id) => (
              <label key={id} className="choice">
                <input type="radio" name="primary" checked={primary === id} onChange={() => setPrimary(id)} />
                {specialties.find((s) => s.id === id)?.nameEn ?? "Hidden specialty"}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {message && (
        <p role={message.error ? "alert" : "status"} className={message.error ? "form-error" : "muted"}>
          {message.text}
        </p>
      )}
      <button className="button button-primary" disabled={busy || !chosen.length}>
        {busy ? "Saving…" : "Save specialties"}
      </button>
    </form>
  );
}
