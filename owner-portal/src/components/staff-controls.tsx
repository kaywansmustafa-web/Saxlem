"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ReceptionDoctorPicker,
  pickedDoctors,
  type PickerDoctor,
} from "./reception-doctor-picker";

type Membership = {
  id: string;
  organizationName: string;
  clinicName: string;
  role: string;
  status: "active" | "inactive";
};

export function StaffControls({
  staffId,
  status,
  memberships,
  organizations,
  clinics,
  doctors = [],
}: {
  doctors?: PickerDoctor[];
  staffId: string;
  status: "active" | "inactive";
  memberships: Membership[];
  organizations: { id: string; name: string }[];
  clinics: { id: string; organizationId: string; name: string }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [clinicId, setClinicId] = useState("");
  const [role, setRole] = useState("receptionist");
  async function mutate(body: Record<string, unknown>) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/platform/staff/${staffId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        error?: { message?: string };
      };
      if (!response.ok || !result.ok)
        throw new Error(result.error?.message ?? "The change failed.");
      setMessage("Staff access updated.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The change failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="card detail-card" aria-labelledby="staff-access-title">
      <h2 id="staff-access-title">Access controls</h2>
      <button
        className="button button-secondary"
        disabled={busy}
        onClick={() =>
          void mutate({
            operation: "status",
            status: status === "active" ? "inactive" : "active",
          })
        }
      >
        {status === "active" ? "Deactivate account" : "Activate account"}
      </button>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const doctorIds = pickedDoctors(event.currentTarget);
          if (
            role === "receptionist" &&
            doctorIds.length === 0 &&
            doctors.some((d) => d.clinics.some((c) => c.id === clinicId))
          ) {
            setMessage("Choose the doctor this receptionist works for.");
            return;
          }
          void mutate({
            operation: "addMembership",
            organizationId: data.get("organizationId"),
            clinicId: data.get("clinicId"),
            role: data.get("role"),
            ...(role === "receptionist" && doctorIds.length
              ? { doctorIds }
              : {}),
          });
        }}
      >
        <label className="field">
          Organization
          <select name="organizationId" required defaultValue="">
            <option value="" disabled>
              Choose organization
            </option>
            {organizations.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Clinic
          <select
            name="clinicId"
            required
            value={clinicId}
            onChange={(event) => setClinicId(event.target.value)}
          >
            <option value="" disabled>
              Choose clinic
            </option>
            {clinics.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Role
          <select
            name="role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <option value="receptionist">Receptionist</option>
            <option value="doctor">Doctor</option>
          </select>
        </label>
        {role === "receptionist" && (
          <ReceptionDoctorPicker doctors={doctors} clinicId={clinicId} />
        )}
        <button className="button button-primary" disabled={busy}>
          Add assignment
        </button>
      </form>
      <ul className="list compact-list" aria-label="Current memberships">
        {memberships.map((membership) => (
          <li key={membership.id}>
            <span>
              <strong>{membership.role}</strong>
              <br />
              <small>
                {membership.organizationName} · {membership.clinicName} ·{" "}
                {membership.status}
              </small>
            </span>
            {membership.status === "active" && (
              <button
                className="button button-secondary"
                disabled={busy}
                onClick={() =>
                  void mutate({
                    operation: "removeMembership",
                    membershipId: membership.id,
                  })
                }
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
