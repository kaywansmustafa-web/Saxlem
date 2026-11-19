import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { DayBoard } from "@/features/appointments/presentation/day-board";
import { bookingMessages } from "@/features/appointments/presentation/booking-messages";
import type { DayBoard as Board } from "@/features/appointments/data/backend-appointment-repository";

const doctor = "00000000-0000-4000-8000-000000000001";
const appointment = (
  id: string,
  origin: "patientBooked" | "clinicCreated" | "walkIn",
  patientName: string,
) => ({
  id: `00000000-0000-4000-8000-00000000000${id}`,
  reference: `SX-2026-00000${id}`,
  origin,
  status: "scheduled" as const,
  patientName,
});
const board: Board = {
  date: "2026-11-17",
  clinicId: "00000000-0000-4000-8000-0000000000bb",
  clinicTimezone: "Asia/Baghdad",
  durationMinutes: 30,
  generatedAt: "2026-11-17T05:10:00.000Z",
  doctors: [
    {
      doctorId: doctor,
      doctorName: "Dr. Shilan",
      slots: [
        {
          startsAt: "2026-11-17T05:00:00.000Z",
          endsAt: "2026-11-17T05:30:00.000Z",
          state: "booked",
          walkIn: false,
          appointment: appointment("1", "patientBooked", "Viyan"),
        },
        {
          startsAt: "2026-11-17T05:30:00.000Z",
          endsAt: "2026-11-17T06:00:00.000Z",
          state: "free",
          walkIn: true,
          appointment: null,
        },
        {
          startsAt: "2026-11-17T06:00:00.000Z",
          endsAt: "2026-11-17T06:30:00.000Z",
          state: "booked",
          walkIn: false,
          appointment: appointment("2", "clinicCreated", "Soran"),
        },
        {
          startsAt: "2026-11-17T06:30:00.000Z",
          endsAt: "2026-11-17T07:00:00.000Z",
          state: "booked",
          walkIn: false,
          appointment: appointment("3", "walkIn", "Lana"),
        },
        {
          startsAt: "2026-11-17T07:00:00.000Z",
          endsAt: "2026-11-17T07:30:00.000Z",
          state: "unavailable",
          walkIn: false,
          appointment: null,
        },
        {
          startsAt: "2026-11-17T07:30:00.000Z",
          endsAt: "2026-11-17T08:00:00.000Z",
          state: "free",
          walkIn: false,
          appointment: null,
        },
      ],
    },
  ],
};
const m = bookingMessages("en");

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});
afterEach(cleanup);

describe("reception day board", () => {
  it("shows a key and labels every booked slot by how it was booked", () => {
    const { container } = render(
      <DayBoard board={board} live={false} locale="en" m={m} />,
    );
    const key = screen.getByRole("list", { name: m.legend });
    for (const label of [
      m.legendFree,
      m.legendApp,
      m.legendPhone,
      m.legendWalkIn,
      m.legendUnavailable,
      m.legendPast,
    ])
      expect(key.textContent).toContain(label);
    expect(screen.getByRole("link", { name: /Viyan/ }).className).toContain(
      "app",
    );
    expect(screen.getByRole("link", { name: /Soran/ }).className).toContain(
      "phone",
    );
    expect(screen.getByRole("link", { name: /Lana/ }).className).toContain(
      "walkin",
    );
    expect(screen.getByRole("link", { name: /Soran/ }).textContent).toContain(
      m.legendPhone,
    );
    expect(container.querySelectorAll(".board-cell.free")).toHaveLength(2);
    expect(container.querySelectorAll(".board-cell.unavailable")).toHaveLength(
      1,
    );
  });

  it("offers phone and walk-in for a free time within the hour", () => {
    render(<DayBoard board={board} live={false} locale="en" m={m} />);
    fireEvent.click(screen.getAllByRole("button", { name: /Free/ })[0]!);
    const walkIn = screen.getByRole("link", { name: m.walkInOption });
    expect(walkIn.getAttribute("href")).toContain("mode=walkIn");
    expect(walkIn.getAttribute("href")).toContain(`doctorId=${doctor}`);
    expect(walkIn.getAttribute("href")).toContain(
      "startsAt=2026-11-17T05%3A30%3A00.000Z",
    );
    expect(
      screen.getByRole("link", { name: m.phoneOption }).getAttribute("href"),
    ).toContain("mode=phone");
  });

  it("offers only a phone booking for a later free time", () => {
    render(<DayBoard board={board} live={false} locale="en" m={m} />);
    fireEvent.click(screen.getAllByRole("button", { name: /Free/ })[1]!);
    expect(screen.getByRole("link", { name: m.phoneOption })).toBeTruthy();
    expect(screen.queryByRole("link", { name: m.walkInOption })).toBeNull();
    expect(screen.getByText(m.walkInLater)).toBeTruthy();
  });
});
