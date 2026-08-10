import { beforeEach, describe, expect, it, vi } from "vitest";
const id = "11111111-1111-4111-8111-111111111111";
const plans = vi.fn(),
  assign = vi.fn(),
  finalize = vi.fn(),
  listCommissions = vi.fn();
let composition: Record<string, unknown>;
vi.mock("@/infrastructure/billing-composition", () => ({
  billingComposition: vi.fn(async () => composition),
}));
vi.mock("@/app/api/billing-request", async (load) => {
  const actual = await load<typeof import("@/app/api/billing-request")>();
  return { ...actual, billingOperationKey: vi.fn(() => "server-derived") };
});
import { GET as getPlans } from "@/app/api/billing/plans/route";
import { GET as getCommissions } from "@/app/api/billing/commissions/route";
import { POST as assignPlan } from "@/app/api/billing/organizations/[organizationId]/plan-assignment/route";
import { POST as finalizeStatement } from "@/app/api/billing/statements/[statementId]/finalize/route";

const request = (path: string, init?: RequestInit) =>
  new Request(`https://portal.test${path}`, init);
const mutation = (body: object) =>
  request("/api/billing/test", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://portal.test",
      host: "portal.test",
      "x-saxlem-origin": "portal",
    },
    body: JSON.stringify(body),
  });
describe("billing BFF", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    composition = {
      session: { userId: id, sessionId: id },
      platform: { plans, assign, finalize },
      read: { listCommissions },
      organizationId: id,
    };
    plans.mockResolvedValue([]);
    assign.mockResolvedValue({ id });
    finalize.mockResolvedValue({ id });
    listCommissions.mockResolvedValue({ items: [], nextCursor: null });
  });
  it("allows platform reads and derives mutation idempotency server-side", async () => {
    expect((await getPlans(request("/api/billing/plans"))).status).toBe(200);
    const response = await assignPlan(
      mutation({
        planId: id,
        effectiveFrom: "2026-08-10T00:00:00.000Z",
        expectedVersion: null,
        attemptId: id,
      }),
      { params: Promise.resolve({ organizationId: id }) },
    );
    expect(response.status).toBe(201);
    expect(assign).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: id, planId: id }),
      "server-derived",
    );
  });
  it("denies manager mutations while retaining scoped reads", async () => {
    composition = {
      session: { userId: id, sessionId: id },
      platform: null,
      read: { listCommissions },
      organizationId: id,
    };
    expect(
      (await getCommissions(request(`/api/billing/commissions?pageSize=25`)))
        .status,
    ).toBe(200);
    expect(
      (
        await finalizeStatement(
          mutation({ expectedVersion: 1, attemptId: id }),
          { params: Promise.resolve({ statementId: id }) },
        )
      ).status,
    ).toBe(403);
  });
  it("rejects spoofed security context, malformed bodies and cross-origin mutations", async () => {
    expect(
      (
        await getCommissions(
          request("/api/billing/commissions", {
            headers: { authorization: "Bearer browser" },
          }),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await getCommissions(
          request("/api/billing/commissions", {
            headers: { "x-organization-id": id },
          }),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await assignPlan(
          request("/api/billing/test", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              origin: "https://evil.test",
              host: "portal.test",
            },
            body: "{}",
          }),
          { params: Promise.resolve({ organizationId: id }) },
        )
      ).status,
    ).toBe(403);
  });
});
