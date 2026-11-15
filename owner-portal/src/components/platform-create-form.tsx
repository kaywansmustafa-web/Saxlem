"use client";
import { useState } from "react";

export function PlatformCreateForm({
  kind,
  organizations,
  clinics,
  specialties = [],
}: {
  kind: "staff" | "doctor";
  organizations: { id: string; name: string }[];
  clinics: { id: string; organizationId: string; name: string }[];
  specialties?: { id: string; name: string }[];
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [credential, setCredential] = useState("");
  return (
    <form
      className="card"
      style={{ padding: 24, maxWidth: 760 }}
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setMessage("");
        const raw = Object.fromEntries(new FormData(event.currentTarget));
        const body =
          kind === "staff"
            ? raw
            : {
                ...raw,
                yearsOfExperience: Number(raw.yearsOfExperience),
                languages: String(raw.languages)
                  .split(",")
                  .map((x) => x.trim())
                  .filter(Boolean),
              };
        try {
          const response = await fetch(`/api/platform/${kind}`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
          });
          const result = (await response.json()) as {
            ok?: boolean;
            data?: { activationCredential?: string };
            error?: { message?: string };
          };
          if (!response.ok || !result.ok)
            throw new Error(result.error?.message ?? "Creation failed.");
          setCredential(result.data?.activationCredential ?? "");
          setMessage(
            "Account created. Copy the activation credential now; it will not be shown again.",
          );
          setBusy(false);
        } catch (error) {
          setMessage(
            error instanceof Error ? error.message : "Creation failed.",
          );
          setBusy(false);
        }
      }}
    >
      <Field label="Email" name="email" type="email" />
      {kind === "doctor" && (
        <>
          <Field label="First name" name="firstName" />
          <Field label="Last name" name="lastName" />
          <Field label="Display name" name="displayName" />
          <label className="field">
            Gender
            <select name="gender" defaultValue="unspecified">
              <option value="unspecified">Unspecified</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </label>
          <Field label="License number" name="licenseNumber" />
          <Field
            label="Years of experience"
            name="yearsOfExperience"
            type="number"
          />
          <Field label="Languages (comma separated)" name="languages" />
          <Field label="Biography" name="biography" />
        </>
      )}
      <label className="field">
        Organization
        <select name="organizationId" required defaultValue="">
          <option value="" disabled>
            Choose organization
          </option>
          {organizations.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Clinic
        <select name="clinicId" required defaultValue="">
          <option value="" disabled>
            Choose clinic
          </option>
          {clinics.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </select>
      </label>
      {kind === "staff" ? (
        <label className="field">
          Role
          <select name="role">
            <option value="receptionist">Receptionist</option>
            <option value="clinicManager">Clinic manager</option>
          </select>
        </label>
      ) : (
        <label className="field">
          Specialty
          <select name="specialtyId" required>
            {specialties.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {message && (
        <p
          role={credential ? "status" : "alert"}
          className={credential ? "form-success" : "form-error"}
        >
          {message}
        </p>
      )}
      {credential && (
        <div className="activation-credential">
          <strong>One-time activation credential</strong>
          <code>{credential}</code>
          <p>Expires in 30 minutes. Transfer it through a secure channel.</p>
        </div>
      )}
      <button
        className="button button-primary"
        disabled={busy || Boolean(credential)}
      >
        {busy ? "Creating…" : credential ? "Created" : `Create ${kind}`}
      </button>
      <p>
        <small>
          New accounts remain inactive until secure activation is completed. No
          default password is created.
        </small>
      </p>
    </form>
  );
}
function Field({
  label,
  name,
  type = "text",
}: {
  label: string;
  name: string;
  type?: string;
}) {
  return (
    <label className="field">
      {label}
      <input
        name={name}
        type={type}
        required={name !== "biography"}
        min={type === "number" ? 0 : undefined}
      />
    </label>
  );
}
