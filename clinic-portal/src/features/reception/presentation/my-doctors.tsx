"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReceptionMessages } from "./messages";

interface Doctor {
  readonly id: string;
  readonly displayName: string;
  readonly assigned: boolean;
}

async function save(doctorIds: string[]) {
  const response = await fetch("/api/reception/doctors", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ doctorIds }),
  });
  const json = (await response.json().catch(() => null)) as {
    ok?: boolean;
  } | null;
  return response.ok && json?.ok === true;
}

function DoctorChoices({
  doctors,
  chosen,
  onToggle,
}: {
  doctors: readonly Doctor[];
  chosen: ReadonlySet<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="my-doctor-choices">
      {doctors.map((doctor) => (
        <label
          key={doctor.id}
          className={`my-doctor-choice${chosen.has(doctor.id) ? " on" : ""}`}
        >
          <input
            type="checkbox"
            checked={chosen.has(doctor.id)}
            onChange={() => onToggle(doctor.id)}
          />
          <span className="my-doctor-avatar" aria-hidden="true">
            {doctor.displayName
              .replace(/^Dr\.?\s*/i, "")
              .slice(0, 1)
              .toUpperCase()}
          </span>
          <span>{doctor.displayName}</span>
        </label>
      ))}
    </div>
  );
}

function useChoice(doctors: readonly Doctor[], initial: string[]) {
  const [chosen, setChosen] = useState<Set<string>>(new Set(initial));
  const toggle = (id: string) =>
    setChosen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  return { chosen, toggle, reset: () => setChosen(new Set(initial)), doctors };
}

/** First sign-in: a receptionist picks the doctor they work for. */
export function ChooseDoctors({
  doctors,
  m,
}: {
  doctors: readonly Doctor[];
  m: ReceptionMessages;
}) {
  const router = useRouter();
  const { chosen, toggle } = useChoice(
    doctors,
    doctors.length === 1 ? [doctors[0]!.id] : [],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <section className="my-doctors-setup" aria-labelledby="choose-doctor">
      <h2 id="choose-doctor">{m.chooseTitle}</h2>
      <p>{m.chooseBody}</p>
      {doctors.length === 0 ? (
        <p className="booking-muted">{m.noDoctors}</p>
      ) : (
        <>
          <DoctorChoices doctors={doctors} chosen={chosen} onToggle={toggle} />
          {error && (
            <p className="booking-alert" role="alert">
              {error}
            </p>
          )}
          <button
            type="button"
            className="primary booking-confirm"
            disabled={busy}
            onClick={async () => {
              if (!chosen.size) return setError(m.atLeastOne);
              setBusy(true);
              setError("");
              if (await save([...chosen])) router.refresh();
              else {
                setError(m.failed);
                setBusy(false);
              }
            }}
          >
            {busy ? m.saving : m.save}
          </button>
        </>
      )}
    </section>
  );
}

/** Shows the receptionist's doctors with a way to add or remove some. */
export function MyDoctorsBar({
  doctors,
  m,
}: {
  doctors: readonly Doctor[];
  m: ReceptionMessages;
}) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const mine = doctors.filter((doctor) => doctor.assigned);
  const { chosen, toggle, reset } = useChoice(
    doctors,
    mine.map((doctor) => doctor.id),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="my-doctors-bar">
      <span className="my-doctors-label">{m.myDoctors}</span>
      <ul>
        {mine.map((doctor) => (
          <li key={doctor.id}>{doctor.displayName}</li>
        ))}
      </ul>
      <button
        type="button"
        className="secondary"
        onClick={() => {
          reset();
          setError("");
          dialog.current?.showModal();
        }}
      >
        {m.change}
      </button>
      <dialog ref={dialog} aria-labelledby="my-doctors-title">
        <h2 id="my-doctors-title">{m.editTitle}</h2>
        <p>{m.editBody}</p>
        <DoctorChoices doctors={doctors} chosen={chosen} onToggle={toggle} />
        {error && (
          <p className="booking-alert" role="alert">
            {error}
          </p>
        )}
        <div className="row-actions">
          <button
            type="button"
            className="secondary"
            onClick={() => dialog.current?.close()}
          >
            {m.close}
          </button>
          <button
            type="button"
            className="primary"
            disabled={busy}
            onClick={async () => {
              if (!chosen.size) return setError(m.atLeastOne);
              setBusy(true);
              setError("");
              const ok = await save([...chosen]);
              setBusy(false);
              if (!ok) return setError(m.failed);
              dialog.current?.close();
              router.refresh();
            }}
          >
            {busy ? m.saving : m.save}
          </button>
        </div>
      </dialog>
    </div>
  );
}
