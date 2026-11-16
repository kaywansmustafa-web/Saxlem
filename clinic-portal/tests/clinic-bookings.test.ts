import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const create = vi.fn();
const slots = vi.fn();
const record = vi.fn();
const register = vi.fn();
const context = {
  organizationId: "00000000-0000-4000-8000-0000000000aa",
  clinicId: "00000000-0000-4000-8000-0000000000bb",
};
vi.mock("@/infrastructure/clinical-composition", () => ({
  clinicalComposition: vi.fn(async () => ({
    context,
    appointments: { create, slots },
    arrivals: { record },
    patients: { register },
  })),
}));
import { POST as book } from "@/app/api/appointments/book/route";
import { POST as daySlots } from "@/app/api/appointments/slots/route";
import { POST as registerPatient } from "@/app/api/patients/register/route";
import { backendAppointmentSchema } from "@/features/appointments/data/backend-appointment-repository";
import {
  bookingMessages,
  originLabel,
} from "@/features/appointments/presentation/booking-messages";

const origin = "https://portal.example";
const ids = {
  doctor: "00000000-0000-4000-8000-000000000001",
  patient: "00000000-0000-4000-8000-000000000002",
  appointment: "00000000-0000-4000-8000-000000000003",
  operation: "00000000-0000-4000-8000-000000000004",
};
const post = (path: string, body: unknown, requestOrigin = origin) =>
  new Request(`${origin}${path}`, {
    method: "POST",
    headers: { origin: requestOrigin, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
const booking = {
  doctorId: ids.doctor,
  patientProfileId: ids.patient,
  type: "initial",
  reason: "Walk-in",
  startsAt: "2026-11-17T07:00:00.000Z",
  durationMinutes: 30,
  walkIn: true,
  operationId: ids.operation,
};

beforeEach(() => {
  create.mockReset().mockResolvedValue({ id: ids.appointment, version: 1 });
  slots.mockReset().mockResolvedValue({ slots: [] });
  record.mockReset().mockResolvedValue({});
  register.mockReset().mockResolvedValue({
    patientProfileId: ids.patient,
    displayName: "Shilan Ahmed",
    created: true,
  });
});

describe("phone and walk-in booking BFF", () => {
  it("books into the signed-in clinic and marks a walk-in as arrived", async () => {
    const response = await book(post("/api/appointments/book", booking));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, arrived: true });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: context.organizationId,
        clinicId: context.clinicId,
        walkIn: true,
        idempotencyKey: `portal-book-${ids.operation}`,
      }),
    );
    expect(record).toHaveBeenCalledWith(
      ids.appointment,
      1,
      `portal-arrival-${ids.operation}`,
    );
  });

  it("does not record arrival for phone bookings, and keeps the booking if arrival fails", async () => {
    await book(post("/api/appointments/book", { ...booking, walkIn: false }));
    expect(record).not.toHaveBeenCalled();
    record.mockRejectedValue(new Error("queue closed"));
    const response = await book(post("/api/appointments/book", booking));
    expect(await response.json()).toMatchObject({ ok: true, arrived: false });
  });

  it("never lets the browser choose the clinic or organization", async () => {
    const response = await book(
      post("/api/appointments/book", { ...booking, clinicId: ids.doctor }),
    );
    expect(response.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  it("reads slots for the signed-in clinic only", async () => {
    const response = await daySlots(
      post("/api/appointments/slots", {
        doctorId: ids.doctor,
        patientProfileId: ids.patient,
        type: "initial",
        date: "2026-11-17",
      }),
    );
    expect(response.status).toBe(200);
    expect(slots).toHaveBeenCalledWith(
      expect.objectContaining({ clinicId: context.clinicId }),
    );
  });

  it("registers a patient without the app and rejects other origins", async () => {
    const body = {
      firstName: "Shilan",
      lastName: "Ahmed",
      phoneNumber: "0750 123 4567",
    };
    expect(
      (await registerPatient(post("/api/patients/register", body))).status,
    ).toBe(200);
    expect(register).toHaveBeenCalledWith(body);
    expect(
      (
        await registerPatient(
          post("/api/patients/register", body, "https://evil.example"),
        )
      ).status,
    ).toBe(403);
  });
});

describe("booking contract and copy", () => {
  it("accepts appointments with or without an origin", () => {
    const appointment = {
      id: ids.appointment,
      reference: "SX-2026-000001",
      clinicId: context.clinicId,
      clinicName: "Clinic",
      doctorId: ids.doctor,
      doctorName: "Dr A",
      patientProfileId: ids.patient,
      patientName: "Shilan Ahmed",
      type: "initial",
      reason: "Check-up",
      startsAt: "2026-11-17T07:00:00.000Z",
      endsAt: "2026-11-17T07:30:00.000Z",
      durationMinutes: 30,
      feeIqd: 25000,
      status: "scheduled",
      cancellationReason: null,
      version: 1,
    };
    expect(backendAppointmentSchema.parse(appointment).origin).toBeUndefined();
    expect(
      backendAppointmentSchema.parse({ ...appointment, origin: "walkIn" })
        .origin,
    ).toBe("walkIn");
    expect(() =>
      backendAppointmentSchema.parse({ ...appointment, origin: "fax" }),
    ).toThrow();
  });

  it("has the same messages in every language, all filled in", () => {
    const en = bookingMessages("en");
    for (const locale of ["ar", "ku"] as const) {
      const other = bookingMessages(locale);
      expect(Object.keys(other).sort()).toEqual(Object.keys(en).sort());
      for (const value of Object.values(other))
        expect(value.trim()).not.toBe("");
    }
    expect(originLabel("clinicCreated", en)).toBe("Phone");
    expect(originLabel(undefined, en)).toBeNull();
  });
});
