"use client";
import { LanguagePicker, checkedLanguages } from "./language-picker";
import { useState } from "react";
export function DoctorEditForm({
  doctor,
}: {
  doctor: {
    id: string;
    displayName: string;
    biography: string;
    yearsOfExperience: number;
    languages: string[];
    status: "active" | "inactive";
    version: number;
    customFees: { firstVisitIqd: number | null; followUpIqd: number | null };
    fees: { firstVisitIqd: number; followUpIqd: number };
  };
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  return (
    <form
      className="card detail-card"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setMessage("");
        const raw = Object.fromEntries(new FormData(event.currentTarget));
        const body = {
          displayName: raw.displayName,
          biography: raw.biography,
          yearsOfExperience: Number(raw.yearsOfExperience),
          languages: checkedLanguages(event.currentTarget),
          status: raw.status,
          consultationFeeIqd: fee(raw.consultationFeeIqd),
          followUpFeeIqd: fee(raw.followUpFeeIqd),
          version: doctor.version,
        };
        try {
          const response = await fetch(`/api/platform/doctors/${doctor.id}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
          });
          const result = (await response.json()) as {
            ok?: boolean;
            error?: { message?: string };
          };
          if (!response.ok || !result.ok)
            throw new Error(result.error?.message ?? "Update failed.");
          setMessage("Doctor updated.");
          window.location.reload();
        } catch (error) {
          setMessage(error instanceof Error ? error.message : "Update failed.");
          setBusy(false);
        }
      }}
    >
      <h2>Edit doctor</h2>
      <label className="field">
        Display name
        <input name="displayName" defaultValue={doctor.displayName} required />
      </label>
      <label className="field">
        Biography
        <textarea
          name="biography"
          defaultValue={doctor.biography}
          maxLength={4000}
        />
      </label>
      <label className="field">
        Experience
        <input
          name="yearsOfExperience"
          type="number"
          min={0}
          max={80}
          defaultValue={doctor.yearsOfExperience}
        />
      </label>
      <fieldset className="field fee-fieldset">
        <legend>Fees (IQD)</legend>
        <p className="muted">
          What patients see and pay. Leave empty to use the standard fee
          {doctor.customFees.firstVisitIqd === null
            ? ` (${doctor.fees.firstVisitIqd.toLocaleString("en-US")} IQD)`
            : ""}
          .
        </p>
        <label className="field">
          First visit
          <input
            name="consultationFeeIqd"
            type="number"
            min={0}
            max={5000000}
            step={250}
            inputMode="numeric"
            placeholder="Standard fee"
            defaultValue={doctor.customFees.firstVisitIqd ?? ""}
          />
        </label>
        <label className="field">
          Follow-up
          <input
            name="followUpFeeIqd"
            type="number"
            min={0}
            max={5000000}
            step={250}
            inputMode="numeric"
            placeholder="Same as first visit"
            defaultValue={doctor.customFees.followUpIqd ?? ""}
          />
        </label>
      </fieldset>
      <LanguagePicker selected={doctor.languages} />
      <label className="field">
        Status
        <select name="status" defaultValue={doctor.status}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>
      </label>
      {message && <p role="status">{message}</p>}
      <button className="button button-primary" disabled={busy}>
        {busy ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

/** An empty fee field means "use the standard fee". */
function fee(value: FormDataEntryValue | undefined): number | null {
  const text = typeof value === "string" ? value.trim() : "";
  return text === "" ? null : Number(text);
}
