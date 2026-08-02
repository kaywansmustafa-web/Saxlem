import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { AppointmentMutations } from "@/features/appointments/presentation/appointment-mutations";
import { AppointmentWorkspace } from "@/features/appointments/presentation/appointment-workspace";
import { clinicalMessages } from "@/features/clinical-presentation/messages";
const m = clinicalMessages("en"),
  appointment = {
    id: "00000000-0000-4000-8000-000000000001",
    reference: "SX-1",
    clinicId: "00000000-0000-4000-8000-000000000002",
    clinicName: "Clinic",
    doctorId: "00000000-0000-4000-8000-000000000003",
    doctorName: "Doctor",
    patientProfileId: "00000000-0000-4000-8000-000000000004",
    patientName: "Patient",
    type: "initial" as const,
    reason: "Visit",
    startsAt: "2026-08-02T10:00:00+03:00",
    endsAt: "2026-08-02T10:30:00+03:00",
    durationMinutes: 30,
    feeIqd: 10000,
    status: "confirmed" as const,
    cancellationReason: null,
    version: 1,
  };
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
describe("appointment mutations", () => {
  it("sends deterministic Iraq-local offset and announces success outside the dialog", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));
    render(<AppointmentMutations appointment={appointment} m={m} />);
    fireEvent.click(screen.getByRole("button", { name: m.reschedule }));
    fireEvent.change(screen.getByLabelText(m.startsAt), {
      target: { value: "2026-08-03T10:30" },
    });
    fireEvent.submit(screen.getByRole("dialog").querySelector("form")!);
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(m.success),
    );
    expect(JSON.parse(String(fetch.mock.calls[0][1]?.body)).startsAt).toBe(
      "2026-08-03T10:30:00+03:00",
    );
    expect(screen.getByRole("dialog",{hidden:true})).not.toHaveAttribute("open");
  });
  it("returns focus and prevents dismissal while pending", async () => {
    let resolve!: (value: Response) => void;
    vi.spyOn(globalThis, "fetch").mockReturnValue(
      new Promise((r) => (resolve = r)),
    );
    render(<AppointmentMutations appointment={appointment} m={m} />);
    const opener = screen.getByRole("button", { name: m.cancel });
    fireEvent.click(opener);
    fireEvent.change(screen.getByLabelText(m.reason), {
      target: { value: "Request" },
    });
    fireEvent.submit(screen.getByRole("dialog").querySelector("form")!);
    const cancel = screen.getByRole("button", { name: m.close });
    expect(cancel).toBeDisabled();
    const event = new Event("cancel", { cancelable: true });
    screen.getByRole("dialog").dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    resolve(new Response("{}", { status: 200 }));
    await waitFor(() => expect(opener).toHaveFocus());
  });
  it("does not expose mutations for terminal appointments", () => {
    render(
      <AppointmentWorkspace
        appointment={{ ...appointment, status: "completed" }}
        locale="en"
        m={m}
      />,
    );
    expect(
      screen.queryByRole("button", { name: m.cancel }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: m.reschedule }),
    ).not.toBeInTheDocument();
  });
});
