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
