import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const request = vi.fn();
const restoreOwnerSession = vi.fn();
const refresh = vi.fn();
vi.mock("@/infrastructure/auth", () => ({
  ownerApi: () => ({ request }),
  restoreOwnerSession: () => restoreOwnerSession(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/infrastructure/request-security", async () => {
  const actual = await vi.importActual<typeof import("@/infrastructure/request-security")>(
    "@/infrastructure/request-security",
  );
  return { ...actual, sameOrigin: (r: Request) => r.headers.get("origin") === "https://owner.example" };
});
import { DELETE, PATCH, POST, PUT } from "@/app/api/platform/app/[...path]/route";
import { AppSettingsForm, type SettingRow } from "@/components/app-config/app-settings-form";
import { specialtyCode } from "@/domain/catalog";

const id = "0198d38e-5862-7000-8000-000000000001";
type Handler = typeof POST;
const call = (handler: Handler, path: string[], body?: unknown, origin = "https://owner.example") =>
  handler(
    new Request("https://owner.example/api/platform/app/x", {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    { params: Promise.resolve({ path }) },
  );

describe("catalog and settings route", () => {
  afterEach(() => {
    request.mockReset();
    restoreOwnerSession.mockReset();
  });

  it("passes only known operations to the backend", async () => {
    restoreOwnerSession.mockResolvedValue({ accessToken: "t" });
    request.mockResolvedValue({ id, code: "allergy" });
    const created = await call(POST, ["specialties"], { nameEn: "Allergy", icon: "allergy" });
    expect(created.status).toBe(200);
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "/api/v1/platform/catalog/specialties",
        method: "POST",
        body: { nameEn: "Allergy", icon: "allergy" },
      }),
    );
    expect((await call(PUT, ["doctors", id, "specialties"], { specialtyIds: [id], primarySpecialtyId: id })).status).toBe(200);
    expect(request).toHaveBeenLastCalledWith(
      expect.objectContaining({ path: `/api/v1/platform/doctors/${id}/specialties`, method: "PUT" }),
    );
    expect((await call(DELETE, ["concerns", id])).status).toBe(200);
    expect(request).toHaveBeenLastCalledWith(
      expect.objectContaining({ path: `/api/v1/platform/catalog/concerns/${id}`, method: "DELETE", body: undefined }),
    );

    expect(
      (await call(PUT, ["doctors", id, "hours", id], { weekly: [{ weekday: 1, startsMinute: 540, endsMinute: 780 }], breaks: [] }))
        .status,
    ).toBe(200);
    expect(request).toHaveBeenLastCalledWith(
      expect.objectContaining({ path: `/api/v1/platform/doctors/${id}/hours/${id}`, method: "PUT" }),
    );
    expect((await call(PUT, ["clinics", id, "hours"], { periods: [] })).status).toBe(200);
    expect(
      (await call(POST, ["doctors", id, "leave"], { startsAt: "2026-11-20T00:00:00+03:00", endsAt: "2026-11-21T00:00:00+03:00" }))
        .status,
    ).toBe(200);
    expect((await call(DELETE, ["doctors", id, "leave", id])).status).toBe(200);
    expect(
      (await call(PUT, ["doctors", id, "booking"], { visitMinutes: null, bookable: true, acceptingNewPatients: false })).status,
    ).toBe(200);
    expect(request).toHaveBeenCalledTimes(8);
    expect((await call(PUT, ["doctors", id, "hours", "x"], { weekly: [], breaks: [] })).status).toBe(404);
    expect((await call(PUT, ["doctors", id, "booking"], { visitMinutes: 3, bookable: true, acceptingNewPatients: true })).status).toBe(400);
    expect((await call(DELETE, ["specialties", id])).status).toBe(404);
    expect((await call(PATCH, ["concerns", "../staff"], { status: "active" })).status).toBe(404);
    expect((await call(POST, ["settings"], { changes: {} })).status).toBe(404);
    expect(request).toHaveBeenCalledTimes(8);
  });

  it("refuses other sites, bad bodies and signed-out owners", async () => {
    expect((await call(POST, ["specialties"], { nameEn: "Allergy" }, "https://evil.example")).status).toBe(403);
    expect((await call(POST, ["specialties"], { nameEn: "Allergy", extra: 1 })).status).toBe(400);
    expect(
      (await call(POST, ["concerns"], { labelEn: "A", labelAr: "A", labelKu: "A", icon: "lungs", tone: "red", specialtyIds: [id] }))
        .status,
    ).toBe(400);
    expect((await call(PUT, ["settings"], { changes: { "bad key": 1 } })).status).toBe(400);
    restoreOwnerSession.mockResolvedValue(null);
    expect((await call(PUT, ["settings"], { changes: { "booking.daysAhead": 21 } })).status).toBe(401);
    expect(request).not.toHaveBeenCalled();
  });

  it("explains a duplicate specialty name", async () => {
    restoreOwnerSession.mockResolvedValue({ accessToken: "t" });
    const { OwnerApiError } = await import("@/infrastructure/api-client");
    request.mockRejectedValue(new OwnerApiError(409, "CONFLICT"));
    const response = await call(POST, ["specialties"], { nameEn: "Allergy" });
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: { message: "A specialty with this English name already exists." },
    });
  });
});

describe("app settings form", () => {
  const settings: SettingRow[] = [
    {
      key: "booking.daysAhead",
      group: "booking",
      label: "How far ahead patients can book",
      help: "Days shown in the app.",
      kind: "integer",
      unit: "days",
      min: 1,
      max: 60,
      public: true,
      value: 14,
      defaultValue: 14,
      changedAt: null,
    },
    {
      key: "features.reviews",
      group: "features",
      label: "Reviews",
      help: "Ratings.",
      kind: "boolean",
      unit: null,
      min: null,
      max: null,
      public: true,
      value: true,
      defaultValue: true,
      changedAt: null,
    },
  ];
  const groups = [
    { id: "features", label: "Features" },
    { id: "booking", label: "Booking" },
  ];

  it("shows defaults, blocks values outside the limits and saves only changes", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, result: null }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<AppSettingsForm groups={groups} settings={settings} />);
    expect(screen.getByText(/Default: 14 days/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "No changes" })).toBeDisabled();

    const days = screen.getByLabelText(/How far ahead/);
    await user.clear(days);
    await user.type(days, "90");
    expect(screen.getByRole("alert")).toHaveTextContent("Use 1 to 60.");
    expect(screen.getByRole("button", { name: "Save 1 change" })).toBeDisabled();

    await user.clear(days);
    await user.type(days, "21");
    await user.click(screen.getByLabelText("Reviews"));
    await user.click(screen.getByRole("button", { name: "Save 2 changes" }));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/platform/app/settings",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ changes: { "booking.daysAhead": 21, "features.reviews": false } }),
      }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent("Saved.");
    vi.unstubAllGlobals();
  });
});

describe("specialty codes", () => {
  it("match the server's rule", () => {
    expect(specialtyCode("Ear, Nose & Throat")).toBe("ear-nose-throat");
    expect(specialtyCode("Ophthalmología")).toBe("ophthalmologia");
    expect(specialtyCode("ددان")).toBe("");
  });
});
