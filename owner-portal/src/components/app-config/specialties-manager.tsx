"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  SPECIALTY_NAME_MAX,
  catalogIcons,
  iconLabel,
  specialtyCode,
} from "@/domain/catalog";
import { moved, send } from "./send";

export type SpecialtyRow = {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string | null;
  nameKu: string | null;
  icon: string;
  showOnHome: boolean;
  status: "active" | "inactive";
  activeDoctors: number;
  tiles: { id: string; labelEn: string }[];
};

/** Owner Portal → Specialties: add, rename, order and hide specialties. */
export function SpecialtiesManager({ specialties }: { specialties: SpecialtyRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ids = specialties.map((s) => s.id);

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
          onClick={() => {
            setAdding(true);
            setEditing(null);
          }}
          disabled={adding}
        >
          Add specialty
        </button>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
      </div>
      {adding && (
        <SpecialtyEditor
          busy={busy}
          onCancel={() => setAdding(false)}
          onSave={async (values) => {
            if (await act(() => send("POST", "specialties", values))) setAdding(false);
          }}
        />
      )}
      <div className="card table-card" tabIndex={0} aria-label="Specialties">
        <table className="table catalog-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Name (English · Arabic · Kurdish)</th>
              <th>Icon</th>
              <th>Doctors</th>
              <th>Home tiles</th>
              <th>On Home</th>
              <th>Status</th>
              <th>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {specialties.map((s, index) => (
              <tr key={s.id} className={s.status === "inactive" ? "row-muted" : undefined}>
                <td>
                  <span className="order-buttons">
                    <button
                      type="button"
                      className="button button-small"
                      aria-label={`Move ${s.nameEn} up`}
                      disabled={busy || index === 0}
                      onClick={() => act(() => send("PUT", "specialties/order", { ids: moved(ids, s.id, -1) }))}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="button button-small"
                      aria-label={`Move ${s.nameEn} down`}
                      disabled={busy || index === ids.length - 1}
                      onClick={() => act(() => send("PUT", "specialties/order", { ids: moved(ids, s.id, 1) }))}
                    >
                      ↓
                    </button>
                  </span>
                </td>
                <td>
                  <strong>{s.nameEn}</strong>
                  <div className="catalog-names">
                    <span lang="ar" dir="rtl">
                      {s.nameAr ?? <em className="muted">Arabic missing (English shown)</em>}
                    </span>
                    <span lang="ckb" dir="rtl">
                      {s.nameKu ?? <em className="muted">Kurdish missing (English shown)</em>}
                    </span>
                  </div>
                  <code className="muted">{s.code}</code>
                </td>
                <td>{iconLabel(s.icon)}</td>
                <td className="numeric">
                  {s.activeDoctors}
                  {s.activeDoctors === 0 && s.status === "active" && (
                    <span className="badge badge-warning catalog-hint">No doctors yet</span>
                  )}
                </td>
                <td>{s.tiles.length ? s.tiles.map((t) => t.labelEn).join(", ") : <span className="muted">None</span>}</td>
                <td>{s.showOnHome ? "Yes" : "No"}</td>
                <td>
                  <span className={s.status === "active" ? "badge badge-success" : "badge"}>
                    {s.status === "active" ? "Active" : "Hidden"}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="button button-small"
                    onClick={() => {
                      setEditing(editing === s.id ? null : s.id);
                      setAdding(false);
                    }}
                    aria-expanded={editing === s.id}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {specialties
        .filter((s) => s.id === editing)
        .map((s) => (
          <SpecialtyEditor
            key={s.id}
            specialty={s}
            busy={busy}
            onCancel={() => setEditing(null)}
            onSave={async (values) => {
              if (await act(() => send("PATCH", `specialties/${s.id}`, values))) setEditing(null);
            }}
          />
        ))}
    </>
  );
}

function SpecialtyEditor({
  specialty,
  busy,
  onSave,
  onCancel,
}: {
  specialty?: SpecialtyRow;
  busy: boolean;
  onSave: (values: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const [nameEn, setNameEn] = useState(specialty?.nameEn ?? "");
  const code = specialty?.code ?? specialtyCode(nameEn);
  return (
    <form
      className="card detail-card catalog-editor"
      onSubmit={(event) => {
        event.preventDefault();
        const raw = Object.fromEntries(new FormData(event.currentTarget));
        const values: Record<string, unknown> = {
          nameEn: String(raw.nameEn ?? "").trim(),
          nameAr: String(raw.nameAr ?? "").trim() || null,
          nameKu: String(raw.nameKu ?? "").trim() || null,
          icon: raw.icon,
          showOnHome: raw.showOnHome === "on",
        };
        if (specialty) values.status = raw.status;
        onSave(values);
      }}
    >
      <h2>{specialty ? `Edit ${specialty.nameEn}` : "Add a specialty"}</h2>
      <label className="field">
        Name in English
        <input
          name="nameEn"
          required
          minLength={2}
          maxLength={SPECIALTY_NAME_MAX}
          value={nameEn}
          onChange={(event) => setNameEn(event.target.value)}
          aria-describedby="specialty-code"
        />
      </label>
      <p id="specialty-code" className="muted">
        {specialty
          ? `Code: ${specialty.code} (never changes).`
          : code
            ? `Code: ${code}. It never changes after you add it.`
            : "Use Latin letters for the English name."}
      </p>
      <label className="field">
        Name in Arabic
        <input name="nameAr" lang="ar" dir="rtl" maxLength={SPECIALTY_NAME_MAX} defaultValue={specialty?.nameAr ?? ""} />
      </label>
      <label className="field">
        Name in Kurdish (Badini)
        <input name="nameKu" lang="ckb" dir="rtl" maxLength={SPECIALTY_NAME_MAX} defaultValue={specialty?.nameKu ?? ""} />
      </label>
      <p className="muted">Empty Arabic or Kurdish names show the English name in the app.</p>
      <label className="field">
        Icon
        <select name="icon" defaultValue={specialty?.icon ?? "hospital"}>
          {catalogIcons.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="check-field">
        <input type="checkbox" name="showOnHome" defaultChecked={specialty?.showOnHome ?? true} />
        Show in the specialties strip on Home
      </label>
      {specialty && (
        <label className="field">
          Status
          <select name="status" defaultValue={specialty.status}>
            <option value="active">Active: patients can find these doctors</option>
            <option value="inactive">Hidden: not in the app</option>
          </select>
        </label>
      )}
      {specialty && specialty.activeDoctors > 0 && (
        <p className="muted">
          Hiding it removes it from the app; its {specialty.activeDoctors} doctor
          {specialty.activeDoctors === 1 ? "" : "s"} stay findable through their other specialties only.
        </p>
      )}
      <div className="form-actions">
        <button className="button button-primary" disabled={busy || (!specialty && !code)}>
          {busy ? "Saving…" : specialty ? "Save" : "Add specialty"}
        </button>
        <button type="button" className="button button-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
