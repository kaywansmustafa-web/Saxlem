import { afterEach, describe, expect, it, vi } from "vitest";

const request = vi.fn();
const restoreOwnerSession = vi.fn();
vi.mock("@/infrastructure/auth", () => ({
  ownerApi: () => ({ request }),
  restoreOwnerSession: () => restoreOwnerSession(),
}));
vi.mock("@/infrastructure/request-security", async () => {
  const actual = await vi.importActual<
    typeof import("@/infrastructure/request-security")
  >("@/infrastructure/request-security");
  return {
    ...actual,
    sameOrigin: (r: Request) =>
      r.headers.get("origin") === "https://owner.example",
  };
});
import { POST as settle } from "@/app/api/platform/payouts/[organizationId]/route";
import { PUT as saveProfile } from "@/app/api/platform/payout-profiles/[organizationId]/route";
import { currentMonth, iqd } from "@/domain/money";

const organizationId = "0198d38e-5862-7000-8000-000000000001";
const send = (
  handler: typeof settle,
  method: string,
  body: unknown,
  origin = "https://owner.example",
) =>
  handler(
    new Request(`https://owner.example/x/${organizationId}`, {
      method,
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ organizationId }) },
  );

describe("payout routes", () => {
  afterEach(() => {
    request.mockReset();
    restoreOwnerSession.mockReset();
  });

  it("forwards a settlement with the amount the operator saw", async () => {
    restoreOwnerSession.mockResolvedValue({ accessToken: "t" });
    request.mockResolvedValue({ status: "settled" });
    const body = {
      month: "2026-10",
      expectedNetPayableIqd: 24875,
      reference: "FIB-TX-1",
    };
    expect((await send(settle, "POST", body)).status).toBe(200);
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        path: `/api/v1/platform/organizations/${organizationId}/payouts`,
        body,
      }),
    );
  });

  it("rejects bad months, other origins and missing references", async () => {
    restoreOwnerSession.mockResolvedValue({ accessToken: "t" });
    const body = { month: "2026-10", expectedNetPayableIqd: 1, reference: "R" };
    expect(
      (await send(settle, "POST", { ...body, month: "2026-13" })).status,
    ).toBe(400);
    expect(
      (await send(settle, "POST", { ...body, reference: "" })).status,
    ).toBe(400);
    expect(
      (await send(settle, "POST", body, "https://evil.example")).status,
    ).toBe(403);
    expect(request).not.toHaveBeenCalled();
  });

  it("saves the online switch and payout account", async () => {
    restoreOwnerSession.mockResolvedValue({ accessToken: "t" });
    request.mockResolvedValue({ organizationId });
    const body = {
      onlinePaymentsEnabled: true,
      payoutAccountName: "Clinic LLC",
      payoutAccountNumber: "IQ12 FIBI 0000 1111",
    };
    expect((await send(saveProfile, "PUT", body)).status).toBe(200);
    expect(
      (await send(saveProfile, "PUT", { ...body, payoutAccountNumber: "<x>" }))
        .status,
    ).toBe(400);
  });

  it("formats money and Baghdad months", () => {
    expect(iqd(24875)).toBe("24,875 IQD");
    expect(currentMonth(new Date("2026-11-30T22:30:00Z"))).toBe("2026-12");
  });
});
