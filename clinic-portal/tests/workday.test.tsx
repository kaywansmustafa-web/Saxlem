import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DoctorDesk } from "@/features/workday/doctor-desk";
import { ReceptionToday, type DoctorDay } from "@/features/workday/reception-today";
import { workdayMessages } from "@/features/workday/messages";
import { clinicDayBounds, formatter } from "@/lib/format";
import type { BackendAppointment } from "@/features/appointments/data/backend-appointment-repository";
import type { QueueSummary, StaffEntry } from "@/features/live-queue/data/backend-queue-repository";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }), usePathname: () => "/en/doctor/session" }));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  refresh.mockReset();
});

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const appointment = (n: number, over: Partial<BackendAppointment> = {}): BackendAppointment => ({
  id: id(n),
  reference: `SX-2026-00000${n}`,
  clinicId: id(90),
  clinicName: "Hillview",
  doctorId: id(91),
  doctorName: "Dr. Shilan",
  patientProfileId: id(100 + n),
  patientName: `Patient ${n}`,
  type: "initial",
  origin: "patientBooked",
  reason: "Check-up",
  startsAt: `2026-11-18T0${n}:00:00.000Z`,
  endsAt: `2026-11-18T0${n}:30:00.000Z`,
  durationMinutes: 30,
  feeIqd: 25000,
  status: "scheduled",
  version: 1,
  ...over,
});
const entry = (n: number, status: StaffEntry["status"]): StaffEntry => ({
  entryId: id(200 + n),
  queueSessionId: id(300),
  appointmentId: id(n),
  appointmentReference: `SX-2026-00000${n}`,
  patientProfileId: id(100 + n),
  patientDisplayName: `Patient ${n}`,
  ticketNumber: n,
  status,
  enqueuedAt: "2026-11-18T06:00:00.000Z",
  calledAt: status === "waiting" ? null : "2026-11-18T06:10:00.000Z",
  consultationStartedAt: status === "inConsultation" ? "2026-11-18T06:12:00.000Z" : null,
  completedAt: null,
  noResponseAt: null,
  version: 2,
});
const queue = (over: Partial<QueueSummary> = {}): QueueSummary => ({
  id: id(300),
  status: "open",
  version: 4,
  waitingCount: 1,
  operationalDate: "2026-11-18",
  effectiveTimezone: "Asia/Baghdad",
  currentPatient: null,
  updatedAt: "2026-11-18T06:00:00.000Z",
  ...over,
});

describe("portal formatting", () => {
  it("writes one date style, 24-hour times and Western digits in every language", () => {
    expect(formatter("en").day("2026-11-17T09:05:00Z")).toBe("17 Nov 2026");
    expect(formatter("en").time("2026-11-17T09:05:00Z")).toBe("12:05");
    expect(formatter("ar").time("2026-11-17T09:05:00Z")).toBe("12:05");
    expect(formatter("ku").iqd(93250)).toBe("93,250 IQD");
  });
  it("bounds a clinic day in Baghdad time", () => {
    expect(clinicDayBounds("2026-11-18")).toEqual({ from: "2026-11-17T21:00:00.000Z", to: "2026-11-18T21:00:00.000Z" });
  });
});

describe("doctor desk", () => {
  const base = { locale: "en" as const, doctorName: "Dr. Shilan", specialty: "Cardiology", clinicName: "Hillview", timeZone: "Asia/Baghdad" };

  it("asks the doctor to open the queue when there is none, and opens it", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    const { container } = render(<DoctorDesk {...base} appointments={[appointment(1)]} queue={null} entries={[]} />);
    expect(screen.getByRole("heading", { name: workdayMessages("en").queueNotOpenTitle })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Open today's queue" }));
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({ operation: "open" });
    expect(refresh).toHaveBeenCalled();
    expect((await axe(container)).violations).toEqual([]);
  });

  it("shows who is in the room and finishes the consultation with both versions", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    const current = entry(2, "inConsultation");
    render(
      <DoctorDesk
        {...base}
        appointments={[appointment(1), appointment(2)]}
        queue={queue({ currentPatient: current })}
        entries={[current, entry(3, "waiting")]}
      />,
    );
    expect(screen.getByRole("img", { name: "Ticket 2" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Finish consultation" }));
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({
      operation: "complete-consultation",
      queueId: id(300),
      entryId: current.entryId,
      sessionVersion: 4,
      entryVersion: 2,
    });
  });

  it("tells the doctor plainly when someone else changed the queue", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 409 })));
    render(<DoctorDesk {...base} appointments={[]} queue={queue()} entries={[entry(3, "waiting")]} />);
    await userEvent.click(screen.getByRole("button", { name: "Call next patient" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(workdayMessages("en").stale);
  });

  it("renders right-to-left Badini without English leaking in", () => {
    render(<DoctorDesk {...base} locale="ku" appointments={[appointment(1)]} queue={null} entries={[]} />);
    expect(screen.getByRole("button", { name: workdayMessages("ku").openQueue })).toBeInTheDocument();
    expect(screen.queryByText("Open today's queue")).not.toBeInTheDocument();
  });
});

describe("reception today", () => {
  it("summarises every doctor's day and links each next patient to check-in", async () => {
    const day: DoctorDay = {
      doctorId: id(91),
      doctorName: "Dr. Shilan",
      freeLater: 6,
      appointments: [
        { id: id(1), startsAt: "2099-01-01T08:00:00.000Z", patientName: "Patient 1", origin: "walkIn", status: "scheduled" },
        { id: id(2), startsAt: "2099-01-01T09:00:00.000Z", patientName: "Patient 2", origin: "clinicCreated", status: "completed" },
      ],
      queue: queue({ currentPatient: entry(4, "called") }),
      entries: [entry(4, "called"), entry(5, "waiting")],
    };
    const { container } = render(<ReceptionToday locale="en" timeZone="Asia/Baghdad" days={[day]} />);
    expect(screen.getByText("Free times left").previousSibling).toHaveTextContent("6");
    expect(screen.getByRole("link", { name: "Check in" })).toHaveAttribute("href", `/en/appointments/${id(1)}/arrival`);
    expect(screen.getByRole("link", { name: /New booking/ })).toHaveAttribute("href", "/en/appointments/new");
    expect((await axe(container)).violations).toEqual([]);
  });
});
