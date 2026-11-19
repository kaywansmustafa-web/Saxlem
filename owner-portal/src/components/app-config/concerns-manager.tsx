"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CONCERNS_ACTIVE_MAX,
  CONCERN_LABEL_MAX,
  catalogIcons,
  concernTones,
  iconLabel,
  tone,
} from "@/domain/catalog";
import { moved, send } from "./send";

export type ConcernRow = {
  id: string;
  labelEn: string;
  labelAr: string;
  labelKu: string;
  icon: string;
  tone: string;
  status: "active" | "inactive";
  activeDoctors: number;
  specialties: { id: string; nameEn: string; status: "active" | "inactive" }[];
};
export type SpecialtyChoice = {
  id: string;
  nameEn: string;
  activeDoctors: number;
  status: "active" | "inactive";
};

/** Owner Portal → Home tiles: the "What's bothering you?" tiles. */
export function ConcernsManager({
  concerns,
  specialties,
}: {
  concerns: ConcernRow[];
  specialties: SpecialtyChoice[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ids = concerns.map((c) => c.id);
  const active = concerns.filter((c) => c.status === "active").length;

  const act = async (run: () => ReturnType<typeof send>) => {
    setBusy(true);
    setError("");
    const result = await run();
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return false;
    }
    router.refresh();
    return true;
  };

  return (
    <>
      <div className="catalog-toolbar">
        <button
          type="button"
          className="button button-primary"
          disabled={editing === "new" || active >= CONCERNS_ACTIVE_MAX}
          onClick={() => setEditing("new")}
        >
          Add tile
        </button>
        <span className="muted">
          {active} of {CONCERNS_ACTIVE_MAX} tiles shown
        </span>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
      </div>
      {editing === "new" && (
        <ConcernEditor
          specialties={specialties}
          busy={busy}
          onCancel={() => setEditing(null)}
          onSave={async (values) => {
            if (await act(() => send("POST", "concerns", values))) setEditing(null);
          }}
        />
      )}
      <ol className="concern-list">
        {concerns.map((c, index) => {
          const [, , wash, ink] = tone(c.tone);
          const reach = visibility(c);
          return (
            <li key={c.id} className={`card concern-card${c.status === "inactive" ? " row-muted" : ""}`}>
              <div className="concern-preview" style={{ background: wash, color: ink }} aria-hidden="true">
                {iconLabel(c.icon)}
              </div>
              <div className="concern-body">
                <strong>{c.labelEn}</strong>
                <span lang="ar" dir="rtl">{c.labelAr}</span>
                <span lang="ckb" dir="rtl">{c.labelKu}</span>
                <p className="muted">
                  Opens:{" "}
                  {c.specialties.length
                    ? c.specialties
                        .map((s) => (s.status === "active" ? s.nameEn : `${s.nameEn} (hidden)`))
                        .join(", ")
                    : "no specialty"}
                  {" · "}
                  {c.activeDoctors} doctor{c.activeDoctors === 1 ? "" : "s"}
                </p>
                <span className={`badge ${reach.tone}`}>{reach.text}</span>
              </div>
              <div className="concern-actions">
                <button
                  type="button"
                  className="button button-small"
                  aria-label={`Move ${c.labelEn} up`}
                  disabled={busy || index === 0}
                  onClick={() => act(() => send("PUT", "concerns/order", { ids: moved(ids, c.id, -1) }))}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="button button-small"
                  aria-label={`Move ${c.labelEn} down`}
                  disabled={busy || index === ids.length - 1}
                  onClick={() => act(() => send("PUT", "concerns/order", { ids: moved(ids, c.id, 1) }))}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="button button-small"
                  aria-expanded={editing === c.id}
                  onClick={() => setEditing(editing === c.id ? null : c.id)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="button button-small"
                  disabled={busy || (c.status === "inactive" && active >= CONCERNS_ACTIVE_MAX)}
                  onClick={() =>
                    act(() =>
                      send("PATCH", `concerns/${c.id}`, {
                        status: c.status === "active" ? "inactive" : "active",
                      }),
                    )
                  }
                >
                  {c.status === "active" ? "Hide" : "Show"}
                </button>
                <button
                  type="button"
                  className="button button-small review-hide"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm(`Delete the tile "${c.labelEn}"? Doctors and specialties are not affected.`))
                      void act(() => send("DELETE", `concerns/${c.id}`));
                  }}
                >
                  Delete
                </button>
              </div>
              {editing === c.id && (
                <ConcernEditor
                  concern={c}
                  specialties={specialties}
                  busy={busy}
                  onCancel={() => setEditing(null)}
                  onSave={async (values) => {
                    if (await act(() => send("PATCH", `concerns/${c.id}`, values))) setEditing(null);
                  }}
                />
              )}
            </li>
          );
        })}
      </ol>
    </>
  );
}

/** Whether patients will see the tile, and why not. */
function visibility(c: ConcernRow): { text: string; tone: string } {
  if (c.status === "inactive") return { text: "Hidden", tone: "" };
  if (!c.specialties.some((s) => s.status === "active"))
    return { text: "Not shown: link an active specialty", tone: "badge-warning" };
  if (c.activeDoctors === 0)
    return { text: "Not shown yet: no doctors in its specialties", tone: "badge-warning" };
  return { text: "Shown in the app", tone: "badge-success" };
}

function ConcernEditor({
  concern,
  specialties,
  busy,
  onSave,
  onCancel,
}: {
  concern?: ConcernRow;
  specialties: SpecialtyChoice[];
  busy: boolean;
  onSave: (values: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const linked = new Set(concern?.specialties.map((s) => s.id) ?? []);
  const [problem, setProblem] = useState("");
  const choices = specialties.filter((s) => s.status === "active" || linked.has(s.id));
  return (
    <form
      className="card detail-card catalog-editor"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const specialtyIds = form.getAll("specialtyIds").map(String);
        if (!specialtyIds.length) {
          setProblem("Tick at least one specialty, so the tile has doctors to show.");
          return;
        }
        setProblem("");
        onSave({
          labelEn: String(form.get("labelEn") ?? "").trim(),
          labelAr: String(form.get("labelAr") ?? "").trim(),
          labelKu: String(form.get("labelKu") ?? "").trim(),
          icon: form.get("icon"),
          tone: form.get("tone"),
          specialtyIds,
        });
      }}
    >
      <h2>{concern ? `Edit "${concern.labelEn}"` : "Add a tile"}</h2>
      <p className="muted">
        Write it the way a patient would say it, e.g. &ldquo;My child is sick&rdquo;. Keep it short: it sits under a small
        picture, four to a row.
      </p>
      <label className="field">
        English
        <input name="labelEn" required maxLength={CONCERN_LABEL_MAX} defaultValue={concern?.labelEn} />
      </label>
      <label className="field">
        Arabic
        <input name="labelAr" lang="ar" dir="rtl" required maxLength={CONCERN_LABEL_MAX} defaultValue={concern?.labelAr} />
      </label>
      <label className="field">
        Kurdish (Badini)
        <input name="labelKu" lang="ckb" dir="rtl" required maxLength={CONCERN_LABEL_MAX} defaultValue={concern?.labelKu} />
      </label>
      <label className="field">
        Icon
        <select name="icon" defaultValue={concern?.icon ?? "general"}>
          {catalogIcons.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="field">
        <legend>Colour</legend>
        <div className="choice-row">
          {concernTones.map(([value, label, wash, ink]) => (
            <label key={value} className="choice">
              <input type="radio" name="tone" value={value} defaultChecked={(concern?.tone ?? "blue") === value} />
              <span className="tone-swatch" style={{ background: wash, borderColor: ink }} aria-hidden="true" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="field">
        <legend>Opens doctors in these specialties</legend>
        <div className="choice-row">
          {choices.map((s) => (
            <label key={s.id} className="choice">
              <input type="checkbox" name="specialtyIds" value={s.id} defaultChecked={linked.has(s.id)} />
              {s.nameEn}
              <span className="muted">
                ({s.activeDoctors}
                {s.status === "inactive" ? ", hidden" : ""})
              </span>
            </label>
          ))}
        </div>
        {!choices.length && <p className="muted">Add a specialty first (Specialties page).</p>}
      </fieldset>
      {problem && (
        <p role="alert" className="form-error">
          {problem}
        </p>
      )}
      <div className="form-actions">
        <button className="button button-primary" disabled={busy}>
          {busy ? "Saving…" : concern ? "Save" : "Add tile"}
        </button>
        <button type="button" className="button button-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
