"use client";
import { useState } from "react";
import { parseMapPin } from "@/domain/map-pin";

type Location = {
  address: string | null;
  area: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  phoneNumber: string | null;
};

/** Address, map pin (paste a Google Maps link) and the clinic's phone. */
export function ClinicLocationForm({
  clinicId,
  location,
}: {
  clinicId: string;
  location: Location;
}) {
  const initialPin =
    location.latitude !== null && location.longitude !== null
      ? `${location.latitude}, ${location.longitude}`
      : "";
  const [pinText, setPinText] = useState(initialPin),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const pin = parseMapPin(pinText);
  const pinProblem = pinText.trim() !== "" && !pin;
  return (
    <form
      className="card detail-card"
      onSubmit={async (event) => {
        event.preventDefault();
        if (pinProblem) return;
        setBusy(true);
        setMessage("");
        const raw = Object.fromEntries(new FormData(event.currentTarget));
        const value = (key: string) => {
          const text = String(raw[key] ?? "").trim();
          return text === "" ? null : text;
        };
        try {
          const response = await fetch(
            `/api/platform/clinics/${clinicId}/location`,
            {
              method: "PUT",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                address: value("address"),
                area: value("area"),
                city: value("city"),
                latitude: pin?.latitude ?? null,
                longitude: pin?.longitude ?? null,
                phoneNumber: value("phoneNumber"),
              }),
            },
          );
          const result = (await response.json()) as {
            ok?: boolean;
            error?: { message?: string };
          };
          if (!response.ok || !result.ok)
            throw new Error(result.error?.message ?? "Saving failed.");
          setMessage("Saved. Patients now see this on the doctor's profile.");
        } catch (error) {
          setMessage(error instanceof Error ? error.message : "Saving failed.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>Location and phone</h2>
      <p className="muted">
        Patients see this with Directions and Call buttons on every doctor at
        this clinic and on their appointments.
      </p>
      <label className="field">
        Address
        <input
          name="address"
          maxLength={300}
          placeholder="Kurdistan St, near the Grand Bazaar, 2nd floor"
          defaultValue={location.address ?? ""}
        />
      </label>
      <div className="grid split">
        <label className="field">
          Area
          <input
            name="area"
            maxLength={120}
            placeholder="Nakhoshkhana"
            defaultValue={location.area ?? ""}
          />
        </label>
        <label className="field">
          City
          <input
            name="city"
            maxLength={80}
            placeholder="Duhok"
            defaultValue={location.city ?? ""}
          />
        </label>
      </div>
      <label className="field">
        Map pin
        <input
          value={pinText}
          onChange={(event) => setPinText(event.target.value)}
          placeholder="Paste a Google Maps link, or 36.8669, 42.9886"
          aria-invalid={pinProblem || undefined}
          aria-describedby="pin-help"
        />
      </label>
      <p id="pin-help" className={pinProblem ? "form-error" : "muted"}>
        {pinProblem
          ? "That link has no map position in it. In Google Maps, press and hold the clinic, then copy the coordinates or share link."
          : pin
            ? `Pin: ${pin.latitude.toFixed(5)}, ${pin.longitude.toFixed(5)} · `
            : "In Google Maps, press and hold the clinic's entrance and paste the coordinates here."}
        {pin && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${pin.latitude},${pin.longitude}`}
            target="_blank"
            rel="noreferrer"
          >
            Check on the map
          </a>
        )}
      </p>
      <label className="field">
        Clinic phone for patients
        <input
          name="phoneNumber"
          inputMode="tel"
          maxLength={24}
          placeholder="0750 123 4567"
          defaultValue={location.phoneNumber ?? ""}
        />
      </label>
      {message && <p role="status">{message}</p>}
      <button className="button button-primary" disabled={busy || pinProblem}>
        {busy ? "Saving…" : "Save location"}
      </button>
    </form>
  );
}
