import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "jest-axe";
import {
  BackendArrivalRepository,
  backendArrivalSchema,
} from "@/features/arrivals/data/backend-arrival-repository";
import {
  ArrivalWorkspace,
  iraqDateTime,
} from "@/features/arrivals/presentation/arrival-workspace";
import { arrivalMessages } from "@/features/arrivals/presentation/messages";
import { AppointmentWorkspace } from "@/features/appointments/presentation/appointment-workspace";
import { clinicalMessages } from "@/features/clinical-presentation/messages";

const appointmentId = "00000000-0000-4000-8000-000000000001";
const arrival = {
  id: "00000000-0000-4000-8000-000000000002",
  appointmentId,
  appointmentReference: "SX-1",
  clinicId: "00000000-0000-4000-8000-000000000003",
  clinicName: "Clinic",
  doctorId: "00000000-0000-4000-8000-000000000004",
  doctorName: "Doctor",
  patientProfileId: "00000000-0000-4000-8000-000000000005",
  patientName: "Patient",
  appointmentStartsAt: "2026-08-03T21:30:00.000Z",
  status: "expected" as const,
  arrivedAt: null,
  queueReadyAt: null,
  version: 1,
};
const appointment = {
  id: appointmentId,
  reference: "SX-1",
  clinicId: arrival.clinicId,
  clinicName: "Clinic",
  doctorId: arrival.doctorId,
  doctorName: "Doctor",
  patientProfileId: arrival.patientProfileId,
  patientName: "Patient",
  type: "initial" as const,
  reason: "Visit",
  startsAt: arrival.appointmentStartsAt,
  endsAt: "2026-08-03T22:00:00.000Z",
  durationMinutes: 30,
  feeIqd: 10000,
  status: "confirmed" as const,
  cancellationReason: null,
  version: 1,
};
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("production arrival adapter", () => {
  it("uses sealed session context, optimistic version and idempotency", async () => {
    const request = vi.fn().mockResolvedValue({ data: arrival }),
      session = {
        context: {
          organizationId: arrival.clinicId,
          clinicId: arrival.clinicId,
        },
      } as never,
      repo = new BackendArrivalRepository({ request } as never, session);
    expect(await repo.get(appointmentId)).toEqual(arrival);
    await repo.record(appointmentId, 1, "portal-arrival-key");
    expect(request).toHaveBeenLastCalledWith(
      expect.objectContaining({
        session,
        idempotencyKey: "portal-arrival-key",
        body: { version: 1 },
      }),
    );
  });
  it("rejects malformed identifiers, states, instants and versions", () => {
    for (const value of [
      { ...arrival, id: "bad" },
      { ...arrival, status: "waiting" },
      { ...arrival, arrivedAt: "today" },
      { ...arrival, version: 0 },
    ])
      expect(backendArrivalSchema.safeParse(value).success).toBe(false);
  });
});

describe("arrival workspace", () => {
  it("keeps appointment details visible when the arrival read fails", () => {
    render(
      <AppointmentWorkspace
        appointment={appointment}
        locale="en"
        m={clinicalMessages("en")}
        arrivalError
        arrivalMessages={arrivalMessages("en")}
      />,
    );
    expect(screen.getByText(appointment.patientName)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      arrivalMessages("en").partialError,
    );
  });
  it("is accessible, Iraq-local and explains queue separation", async () => {
    const view = render(
      <ArrivalWorkspace
        appointment={appointment}
        initialArrival={arrival}
        locale="en"
        m={arrivalMessages("en")}
      />,
    );
    expect(screen.getByText("Aug 4, 2026, 12:30 AM")).toBeInTheDocument();
    expect(
      screen.getByText(arrivalMessages("en").queueSeparate),
    ).toBeInTheDocument();
    expect((await axe(view.container)).violations).toHaveLength(0);
    expect(iraqDateTime("2026-08-03T21:30:00Z", "en")).toContain("Aug 4");
  });
  it("blocks duplicate submissions, preserves attempt ID for retry, and returns focus", async () => {
    let resolve!: (value: Response) => void;
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockReturnValue(new Promise((r) => (resolve = r)));
    render(
      <ArrivalWorkspace
        appointment={appointment}
        initialArrival={arrival}
        locale="en"
        m={arrivalMessages("en")}
      />,
    );
    const opener = screen.getByRole("button", {
      name: arrivalMessages("en").record,
    });
    fireEvent.click(opener);
    const confirm = screen.getByRole("button", {
      name: arrivalMessages("en").confirm,
    });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    expect(fetch).toHaveBeenCalledTimes(1);
    const firstBody = JSON.parse(String(fetch.mock.calls[0]![1]?.body));
    expect(firstBody.version).toBe(1);
    expect(firstBody.operationId).toMatch(/^[0-9a-f-]{36}$/u);
    const cancelEvent = new Event("cancel", { cancelable: true });
    screen.getByRole("dialog").dispatchEvent(cancelEvent);
    expect(cancelEvent.defaultPrevented).toBe(true);
    resolve(
      new Response(
        JSON.stringify({ ok: false, error: { code: "ARRIVAL_WINDOW_CLOSED" } }),
        { status: 409, headers: { "content-type": "application/json" } },
      ),
    );
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        arrivalMessages("en").outsideWindow,
      ),
    );
    fireEvent.click(confirm);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(JSON.parse(String(fetch.mock.calls[1]![1]?.body)).operationId).toBe(
      firstBody.operationId,
    );
  });
  it("announces success, closes the dialog and returns focus", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          arrival: {
            ...arrival,
            status: "queueReady",
            arrivedAt: "2026-08-03T21:35:00Z",
            queueReadyAt: "2026-08-03T21:35:00Z",
            version: 2,
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    render(
      <ArrivalWorkspace
        appointment={appointment}
        initialArrival={arrival}
        locale="ar"
        m={arrivalMessages("ar")}
      />,
    );
    const opener = screen.getByRole("button", {
      name: arrivalMessages("ar").record,
    });
    fireEvent.click(opener);
    fireEvent.click(
      screen.getByRole("button", { name: arrivalMessages("ar").confirm }),
    );
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        arrivalMessages("ar").success,
      ),
    );
    await waitFor(() => expect(screen.getByRole("status")).toHaveFocus());
  });
});
