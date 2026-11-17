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
import { POST as billingAction } from "@/app/api/platform/billing-actions/route";
import { PUT as saveProfile } from "@/app/api/platform/payout-profiles/[organizationId]/route";
import { PUT as saveDoctorAccount } from "@/app/api/platform/doctor-payout-profiles/[organizationId]/[doctorId]/route";
import { currentMonth, iqd } from "@/domain/money";

const organizationId = "0198d38e-5862-7000-8000-000000000001";
const doctorId = "0198d38e-5862-7000-8000-0000000000d1";
type Handler = (
  request: Request,
  context: {
    params: Promise<{ organizationId: string; doctorId: string }>;
  },
) => Promise<Response>;
const post = (body: unknown, origin = "https://owner.example") =>
  billingAction(
    new Request("https://owner.example/api/platform/billing-actions", {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
const send = (
  handler: Handler,
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
    { params: Promise.resolve({ organizationId, doctorId }) },
  );

describe("payout routes", () => {
  afterEach(() => {
    request.mockReset();
    restoreOwnerSession.mockReset();
  });

  it("forwards a statement settlement with the amount the operator saw", async () => {
    restoreOwnerSession.mockResolvedValue({ accessToken: "t" });
    request.mockResolvedValue({ status: "settled" });
    const body = {
      action: "settle",
      organizationId,
      doctorId,
      cycleNumber: 3,
      method: "cash",
      expectedNetPayableIqd: -2500,
      counterpartyName: "Reception",
    };
    expect((await post(body)).status).toBe(200);
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        path: `/api/v1/platform/organizations/${organizationId}/doctors/${doctorId}/statements/3/settlement`,
        body: {
          method: "cash",
          expectedNetPayableIqd: -2500,
          counterpartyName: "Reception",
        },
      }),
    );
  });

  it("maps plan, credit and cycle actions and shows the backend's rule", async () => {
    restoreOwnerSession.mockResolvedValue({ accessToken: "t" });
    request.mockResolvedValue({});
    await post({
      action: "createPlan",
      displayName: "Pilot",
      commissionAmountIqd: 0,
    });
    expect(request).toHaveBeenLastCalledWith(
      expect.objectContaining({
        path: "/api/v1/billing/plans",
        method: "POST",
      }),
    );
    await post({
      action: "doctorPlan",
      organizationId,
      doctorId,
      planId: null,
      from: "2026-11-18",
    });
    expect(request).toHaveBeenLastCalledWith(
      expect.objectContaining({
        path: `/api/v1/billing/organizations/${organizationId}/doctors/${doctorId}/plan`,
        body: { planId: null, from: "2026-11-18" },
      }),
    );
    const { OwnerApiError } = await import("@/infrastructure/api-client");
    request.mockRejectedValue(
      new OwnerApiError(
        409,
        "CONFLICT",
        undefined,
        "Settle statement SX-1-001 first.",
      ),
    );
    const response = await post({
      action: "credit",
      commissionId: doctorId,
      reason: "Goodwill",
    });
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: { message: "Settle statement SX-1-001 first." },
    });
  });

  it("rejects bad actions and other origins", async () => {
    restoreOwnerSession.mockResolvedValue({ accessToken: "t" });
    expect(
      (
        await post({
          action: "createPlan",
          displayName: "X",
          commissionAmountIqd: -1,
        })
      ).status,
    ).toBe(400);
    expect((await post({ action: "drop tables" })).status).toBe(400);
    expect(
      (
        await post(
          { action: "createPlan", displayName: "X", commissionAmountIqd: 1 },
          "https://evil.example",
        )
      ).status,
    ).toBe(403);
    expect(request).not.toHaveBeenCalled();
  });

  it("saves the organization's online switch", async () => {
    restoreOwnerSession.mockResolvedValue({ accessToken: "t" });
    request.mockResolvedValue({ organizationId });
    expect(
      (await send(saveProfile, "PUT", { onlinePaymentsEnabled: true })).status,
    ).toBe(200);
  });

  it("saves each doctor's own payout account", async () => {
    restoreOwnerSession.mockResolvedValue({ accessToken: "t" });
    request.mockResolvedValue({ organizationId, doctorId });
    const body = {
      payoutAccountName: "Dr. Shilan",
      payoutAccountNumber: "IQ12 FIBI 0000 1111",
    };
    expect((await send(saveDoctorAccount, "PUT", body)).status).toBe(200);
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "PUT",
        path: `/api/v1/platform/organizations/${organizationId}/doctors/${doctorId}/payout-profile`,
      }),
    );
    expect(
      (
        await send(saveDoctorAccount, "PUT", {
          ...body,
          payoutAccountNumber: "<x>",
        })
      ).status,
    ).toBe(400);
  });

  it("formats money and Baghdad months", () => {
    expect(iqd(24875)).toBe("24,875 IQD");
    expect(currentMonth(new Date("2026-11-30T22:30:00Z"))).toBe("2026-12");
  });
});
