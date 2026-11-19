"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { send } from "./send";

type Value = boolean | number | string;
export type SettingRow = {
  key: string;
  group: string;
  label: string;
  help: string;
  kind: "boolean" | "integer" | "phone" | "url" | "text";
  unit: string | null;
  min: number | null;
  max: number | null;
  public: boolean;
  value: Value;
  defaultValue: Value;
  changedAt: string | null;
};

const show = (setting: SettingRow, value: Value) =>
  setting.kind === "boolean"
    ? value
      ? "On"
      : "Off"
    : value === ""
      ? "empty"
      : setting.unit === "IQD"
        ? `${Number(value).toLocaleString("en-US")} IQD`
        : `${String(value)}${setting.unit ? ` ${setting.unit}` : ""}`;

/** Checks a value the way the server will, so mistakes show before saving. */
function problem(setting: SettingRow, value: Value): string | null {
  if (setting.kind === "integer") {
    if (typeof value !== "number" || !Number.isInteger(value)) return "Use a whole number.";
    if ((setting.min !== null && value < setting.min) || (setting.max !== null && value > setting.max))
      return `Use ${setting.min} to ${setting.max}.`;
  }
  if (setting.kind === "phone") {
    const digits = String(value).replace(/[\s-]/g, "");
    if (digits === "" && setting.key !== "contact.emergencyNumber") return null;
    if (!/^\+?[0-9]{2,15}$/.test(digits)) return "Use 2 to 15 digits.";
  }
  if (setting.kind === "url" && value !== "") {
    try {
      if (new URL(String(value)).protocol !== "https:") return "Use a full https:// link.";
    } catch {
      return "Use a full https:// link.";
    }
  }
  return null;
}

/** Owner Portal → App settings. Saves only what changed, all at once. */
export function AppSettingsForm({
  groups,
  settings,
}: {
  groups: { id: string; label: string }[];
  settings: SettingRow[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Record<string, Value>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const byKey = useMemo(() => new Map(settings.map((s) => [s.key, s])), [settings]);
  const changes = Object.entries(draft).filter(([key, value]) => byKey.get(key)?.value !== value);
  const problems = changes
    .map(([key, value]) => [key, problem(byKey.get(key)!, value)] as const)
    .filter(([, text]) => text);
  const valueOf = (s: SettingRow) => (s.key in draft ? draft[s.key]! : s.value);
  const set = (key: string, value: Value) => setDraft((current) => ({ ...current, [key]: value }));

  return (
    <form
      className="settings-form"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!changes.length || problems.length) return;
        setBusy(true);
        setMessage(null);
        const result = await send("PUT", "settings", { changes: Object.fromEntries(changes) });
        setBusy(false);
        if (result.ok) {
          setDraft({});
          setMessage({ text: "Saved. The app picks it up within a minute.", error: false });
          router.refresh();
        } else setMessage({ text: result.message, error: true });
      }}
    >
      {groups.map((group) => {
        const rows = settings.filter((s) => s.group === group.id);
        if (!rows.length) return null;
        return (
          <fieldset key={group.id} className="card detail-card settings-group">
            <legend>{group.label}</legend>
            {rows.map((s) => {
              const value = valueOf(s);
              const error = s.key in draft ? problem(s, value) : null;
              const id = `setting-${s.key.replace(".", "-")}`;
              const isDefault = value === s.defaultValue;
              return (
                <div key={s.key} className="setting-row">
                  {s.kind === "boolean" ? (
                    <label className="check-field" htmlFor={id}>
                      <input
                        id={id}
                        type="checkbox"
                        checked={value === true}
                        onChange={(event) => set(s.key, event.target.checked)}
                        aria-describedby={`${id}-help`}
                      />
                      {s.label}
                    </label>
                  ) : (
                    <label className="field" htmlFor={id}>
                      {s.label}
                      <span className="setting-input">
                        <input
                          id={id}
                          type={s.kind === "integer" ? "number" : s.kind === "url" ? "url" : "text"}
                          inputMode={s.kind === "integer" || s.kind === "phone" ? "numeric" : undefined}
                          min={s.min ?? undefined}
                          max={s.max ?? undefined}
                          dir={s.kind === "phone" || s.kind === "url" ? "ltr" : undefined}
                          value={String(value)}
                          aria-invalid={error ? true : undefined}
                          aria-describedby={`${id}-help`}
                          onChange={(event) =>
                            set(
                              s.key,
                              s.kind === "integer"
                                ? event.target.value === ""
                                  ? Number.NaN
                                  : Number(event.target.value)
                                : event.target.value,
                            )
                          }
                        />
                        {s.unit && <span className="muted">{s.unit}</span>}
                      </span>
                    </label>
                  )}
                  <p id={`${id}-help`} className="muted setting-help">
                    {s.help} Default: {show(s, s.defaultValue)}.
                    
                    {!isDefault && (
                      <>
                        {" "}
                        <button type="button" className="text-button" onClick={() => set(s.key, s.defaultValue)}>
                          Use default
                        </button>
                      </>
                    )}
                  </p>
                  {error && (
                    <p role="alert" className="form-error">
                      {error}
                    </p>
                  )}
                </div>
              );
            })}
          </fieldset>
        );
      })}
      <div className="settings-save">
        <button className="button button-primary" disabled={busy || !changes.length || problems.length > 0}>
          {busy ? "Saving…" : changes.length ? `Save ${changes.length} change${changes.length === 1 ? "" : "s"}` : "No changes"}
        </button>
        {changes.length > 0 && (
          <button type="button" className="button button-secondary" onClick={() => setDraft({})}>
            Undo changes
          </button>
        )}
        {message && (
          <p role={message.error ? "alert" : "status"} className={message.error ? "form-error" : "muted"}>
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}
