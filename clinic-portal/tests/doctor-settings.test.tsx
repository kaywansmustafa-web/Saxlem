import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("server-only", () => ({}));
const settings = {
  setWeek: vi.fn(),
  setBooking: vi.fn(),
  setDetails: vi.fn(),
  setOpeningHours: vi.fn(),
  addLeave: vi.fn(),
  removeLeave: vi.fn(),
};
vi.mock("@/infrastructure/clinical-composition", () => ({
  clinicalComposition: vi.fn(async () => ({ doctorSettings: settings })),
}));
import { DELETE, POST, PUT } from "@/app/api/doctor-settings/[...path]/route";
import type { DoctorSettingsView } from "@/features/doctor-settings/data/backend-doctor-settings";
import {
  copyToEveryDay,
  fromTime,
  nextPeriod,
  outside,
  overlapsAny,
  partOfDay,
  weekProblem,
  wholeDays,
} from "@/features/doctor-settings/domain/week";
import { DoctorSettings } from "@/features/doctor-settings/presentation/doctor-settings";
import { doctorSettingsMessages } from "@/features/doctor-settings/presentation/messages";

const doctorId = "00000000-0000-4000-8000-00000000000a";
const leaveId = "00000000-0000-4000-8000-00000000000c";
const everyDay = (from: number, to: number) =>
  Array.from({ length: 7 }, (_, weekday) => ({ weekday, startsMinute: from, endsMinute: to }));
const view: DoctorSettingsView = {
  doctorId,
  displayName: "Dr. Shilan",
  specialties: [{ en: "Pediatrics", ar: null, ku: null }],
  clinicId: "00000000-0000-4000-8000-00000000000b",
  clinicName: "Riverside",
  timezone: "Asia/Baghdad",
  openingHours: everyDay(480, 1260),
  weekly: [{ weekday: 6, startsMinute: 540, endsMinute: 720 }],
  breaks: [],
  elsewhere: [{ weekday: 0, startsMinute: 600, endsMinute: 700 }],
  leave: [{ id: leaveId, startsAt: "2026-11-24T21:00:00.000Z", endsAt: "2026-11-26T21:00:00.000Z" }],
  visitMinutes: null,
  defaultVisitMinutes: 30,
  bookable: true,
  acceptingNewPatients: true,
  nextAvailableAt: null,
  biography: "Children.",
  yearsOfExperience: 9,
  languages: ["badiniKurdish"],
  consultationFeeIqd: null,
  followUpFeeIqd: null,
  defaultFeeIqd: 25000,
};
const m = doctorSettingsMessages("en");
const bodyOf = (call: number) => JSON.parse(String(vi.mocked(fetch).mock.calls[call]![1]!.body));

beforeEach(() => {
  refresh.mockReset();
  for (const fn of Object.values(settings)) fn.mockReset().mockResolvedValue(undefined);
  settings.addLeave.mockResolvedValue({ ids: [leaveId], bookedVisits: 2 });
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ ok: true }))),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("week rules", () => {
  it("matches the server's rules", () => {
    expect(weekProblem(everyDay(540, 720))).toBeNull();
    expect(weekProblem([{ weekday: 1, startsMinute: 541, endsMinute: 720 }])).toEqual({ kind: "steps" });
    expect(weekProblem([{ weekday: 1, startsMinute: 720, endsMinute: 720 }])).toEqual({ kind: "order", weekday: 1 });
    expect(
      weekProblem([
        { weekday: 2, startsMinute: 540, endsMinute: 720 },
        { weekday: 2, startsMinute: 700, endsMinute: 800 },
      ]),
    ).toEqual({ kind: "overlap", weekday: 2 });
    expect(weekProblem(Array.from({ length: 29 }, () => ({ weekday: 1, startsMinute: 0, endsMinute: 5 })))).toEqual({
      kind: "tooMany",
    });
    expect(outside(everyDay(480, 1260), [{ weekday: 3, startsMinute: 420, endsMinute: 600 }])).toHaveLength(1);
    expect(overlapsAny(everyDay(540, 720), [{ weekday: 0, startsMinute: 700, endsMinute: 900 }])).toBe(true);
    expect(fromTime("00:00", true)).toBe(1440);
    expect(fromTime("09:75")).toBeNull();
    expect(nextPeriod(1, [{ weekday: 1, startsMinute: 540, endsMinute: 720 }], [540, 1020])).toEqual({
      weekday: 1,
      startsMinute: 780,
      endsMinute: 960,
    });
    expect(copyToEveryDay([{ weekday: 6, startsMinute: 540, endsMinute: 720 }], 6)).toHaveLength(7);
  });

  it("turns days off into exact clinic-time moments", () => {
    expect(wholeDays("2026-11-25", "2026-11-26", "Asia/Baghdad")).toEqual({
      startsAt: "2026-11-24T21:00:00.000Z",
      endsAt: "2026-11-26T21:00:00.000Z",
    });
    expect(wholeDays("2026-11-26", "2026-11-25", "Asia/Baghdad")).toBeNull();
    expect(partOfDay("2026-11-25", "13:00", "00:00", "Asia/Baghdad")).toEqual({
      startsAt: "2026-11-25T10:00:00.000Z",
      endsAt: "2026-11-25T21:00:00.000Z",
    });
    expect(partOfDay("2026-11-25", "13:00", "12:00", "Asia/Baghdad")).toBeNull();
  });
});

describe("doctor settings page", () => {
  it("saves a week and refuses hours outside the clinic or overlapping another clinic", async () => {
    render(<DoctorSettings view={view} locale="en" />);
    const hours = screen.getByRole("region", { name: m.hoursTitle });
    fireEvent.change(within(hours).getByLabelText("Saturday, from"), { target: { value: "07:00" } });
    expect(within(hours).getByRole("alert").textContent).toBe(m.outsideClinic);
    expect(within(hours).getByRole("button", { name: m.saveHours })).toHaveProperty("disabled", true);
    fireEvent.change(within(hours).getByLabelText("Saturday, from"), { target: { value: "09:00" } });
    fireEvent.click(within(hours).getAllByRole("button", { name: m.copyToAll })[0]!);
    expect(within(hours).getByRole("alert").textContent).toBe(m.elsewhere);
    fireEvent.click(within(hours).getByRole("button", { name: "Remove Sunday 09:00–12:00" }));
    fireEvent.click(within(hours).getByRole("button", { name: m.saveHours }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(vi.mocked(fetch).mock.calls[0]![0]).toBe(`/api/doctor-settings/${doctorId}/hours`);
    expect(bodyOf(0).weekly).toHaveLength(6);
  });

  it("explains a refusal in the user's words", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ ok: false }), { status: 403 }));
    render(<DoctorSettings view={view} locale="en" />);
    const booking = screen.getByRole("region", { name: m.bookingTitle });
    fireEvent.click(within(booking).getByRole("checkbox", { name: new RegExp(m.newPatients) }));
    fireEvent.click(within(booking).getByRole("button", { name: m.saveBooking }));
    await waitFor(() => expect(within(booking).getByRole("alert").textContent).toBe(m.notYours));
  });

  it("sends booking, fees, profile and time off", async () => {
    render(<DoctorSettings view={view} locale="en" />);
    const booking = screen.getByRole("region", { name: m.bookingTitle });
    fireEvent.click(within(booking).getByRole("checkbox", { name: new RegExp(m.ownLength) }));
    fireEvent.change(within(booking).getByRole("spinbutton"), { target: { value: "22" } });
    expect(within(booking).getByRole("alert").textContent).toBe(m.lengthProblem);
    fireEvent.change(within(booking).getByRole("spinbutton"), { target: { value: "20" } });
    fireEvent.click(within(booking).getByRole("button", { name: m.saveBooking }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(bodyOf(0)).toEqual({ visitMinutes: 20, bookable: true, acceptingNewPatients: true });

    const fees = screen.getByRole("region", { name: m.feesTitle });
    fireEvent.click(within(fees).getAllByRole("radio", { name: m.ownFee })[0]!);
    fireEvent.change(within(fees).getByRole("spinbutton"), { target: { value: "30000" } });
    fireEvent.click(within(fees).getByRole("button", { name: m.saveFees }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(bodyOf(1)).toEqual({ consultationFeeIqd: 30000, followUpFeeIqd: null });

    const profile = screen.getByRole("region", { name: m.profileTitle });
    fireEvent.click(within(profile).getByRole("checkbox", { name: /Kurdish \(Badini\)/ }));
    expect(within(profile).getByRole("alert").textContent).toBe(m.languagesProblem);
    fireEvent.click(within(profile).getByRole("checkbox", { name: "Arabic" }));
    fireEvent.click(within(profile).getByRole("button", { name: m.saveProfile }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
    expect(bodyOf(2)).toEqual({ biography: "Children.", yearsOfExperience: 9, languages: ["arabic"] });

    const timeOff = screen.getByRole("region", { name: m.timeOffTitle });
    expect(within(timeOff).getByText("25 Nov 2026 – 26 Nov 2026")).toBeTruthy();
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, bookedVisits: 2 })));
    fireEvent.change(within(timeOff).getByLabelText(m.firstDay), { target: { value: "2026-12-01" } });
    fireEvent.click(within(timeOff).getByRole("button", { name: m.addTimeOff }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(4));
    expect(bodyOf(3)).toEqual({ startsAt: "2026-11-30T21:00:00.000Z", endsAt: "2026-12-01T21:00:00.000Z" });
    await waitFor(() => expect(within(timeOff).getByRole("alert").textContent).toBe(m.timeOffBooked(2)));
  });

  it("renders in Kurdish and Arabic", () => {
    for (const locale of ["ku", "ar"] as const) {
      render(<DoctorSettings view={view} locale={locale} />);
      const words = doctorSettingsMessages(locale);
      expect(screen.getByRole("region", { name: words.hoursTitle })).toBeTruthy();
      expect(screen.getAllByRole("button", { name: words.add }).length).toBeGreaterThan(7);
      cleanup();
    }
  });
});

describe("doctor settings BFF", () => {
  const request = (method: string, path: string, body?: unknown, origin = "https://portal.example") =>
    new Request(`https://portal.example/api/doctor-settings/${path}`, {
      method,
      headers: { origin, "content-type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  const ctx = (path: string) => ({ params: Promise.resolve({ path: path.split("/") }) });

  it("passes only well-formed changes to the backend", async () => {
    const week = { weekly: everyDay(540, 720), breaks: [] };
    expect((await PUT(request("PUT", `${doctorId}/hours`, week), ctx(`${doctorId}/hours`))).status).toBe(200);
    expect(settings.setWeek).toHaveBeenCalledWith(doctorId, week);
    expect(
      (await PUT(request("PUT", `${doctorId}/hours`, week, "https://evil.example"), ctx(`${doctorId}/hours`))).status,
    ).toBe(403);
    expect(
      (await PUT(request("PUT", `${doctorId}/booking`, { visitMinutes: 22, bookable: true, acceptingNewPatients: true }), ctx(`${doctorId}/booking`)))
        .status,
    ).toBe(400);
    expect(
      (await PUT(request("PUT", `${doctorId}/details`, { displayName: "Someone else" }), ctx(`${doctorId}/details`))).status,
    ).toBe(400);
    expect(
      (await PUT(request("PUT", `${doctorId}/details`, { languages: ["klingon"] }), ctx(`${doctorId}/details`))).status,
    ).toBe(400);
    expect(
      (await PUT(request("PUT", `${doctorId}/details`, { consultationFeeIqd: 30000 }), ctx(`${doctorId}/details`))).status,
    ).toBe(200);
    expect(settings.setDetails).toHaveBeenCalledWith(doctorId, { consultationFeeIqd: 30000 });
    expect((await PUT(request("PUT", "opening-hours", { periods: everyDay(480, 1260) }), ctx("opening-hours"))).status).toBe(
      200,
    );
    expect((await PUT(request("PUT", `not-a-doctor/hours`, week), ctx(`not-a-doctor/hours`))).status).toBe(404);
    expect((await PUT(request("PUT", `${doctorId}/status`, {}), ctx(`${doctorId}/status`))).status).toBe(404);

    const leave = { startsAt: "2026-11-24T21:00:00.000Z", endsAt: "2026-11-26T21:00:00.000Z" };
    const added = await POST(request("POST", `${doctorId}/leave`, leave), ctx(`${doctorId}/leave`));
    expect(added.status).toBe(200);
    expect(await added.json()).toEqual({ ok: true, bookedVisits: 2 });
    expect((await DELETE(request("DELETE", `${doctorId}/leave/${leaveId}`), ctx(`${doctorId}/leave/${leaveId}`))).status).toBe(
      200,
    );
    expect(settings.removeLeave).toHaveBeenCalledWith(doctorId, leaveId);
  });
});
