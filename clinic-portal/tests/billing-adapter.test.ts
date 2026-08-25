import { describe, expect, it, vi } from "vitest";
import { BackendBillingRepository } from "@/features/billing/data/backend-billing-repository";
import type { AuthenticatedSession } from "@/features/authentication/domain/auth-models";

const id = "11111111-1111-4111-8111-111111111111";
const session = {
  userId: id,
  sessionId: id,
  role: "platformAdministrator",
  context: null,
  accessToken: "secret",
  refreshToken: "refresh",
  deviceId: id,
  deviceUserAgent: "test",
  accessExpiresAt: Date.now() + 10000,
  sessionExpiresAt: Date.now() + 20000,
} as AuthenticatedSession;
const plan = {
  id,
  code: "STANDARD_1250",
  displayName: "Standard",
  status: "active",
  currency: "IQD",
  commissionAmountIqd: 1250,
  ruleCode: "RULE",
  ruleVersion: 1,
  version: 1,
};
describe("BackendBillingRepository", () => {
  it("uses exact backend routes and keeps authorization in the server API client", async () => {
    const request = vi.fn(async (input: { path: string }) => ({
      data: input.path.includes("commissions")
        ? { items: [], nextCursor: null }
        : input.path.endsWith("plans")
          ? [plan]
          : plan,
    }));
    const repository = new BackendBillingRepository(
      { request } as never,
      session,
    );
    await repository.listPlans();
    await repository.listCommissions({
      organizationId: id,
      pageSize: 25,
      cursor: "opaque.cursor",
    });
    expect(request.mock.calls[0]![0]).toMatchObject({
      path: "/api/v1/billing/plans",
      session,
    });
    expect(request.mock.calls[1]![0].path).toBe(
      `/api/v1/billing/commissions?organizationId=${id}&pageSize=25&cursor=opaque.cursor`,
    );
  });
  it("forwards only backend-required mutation fields and server-derived keys", async () => {
    const request = vi.fn(async (_input: unknown) => {
      void _input;
      return {
        data: {
          id,
          organizationId: id,
          effectiveFrom: "2026-08-10T00:00:00.000Z",
          effectiveTo: null,
          version: 1,
          plan,
        },
      };
    });
    const repository = new BackendBillingRepository(
      { request } as never,
      session,
    );
    await repository.assignOrganizationPlan(
      {
        organizationId: id,
        planId: id,
        effectiveFrom: "2026-08-10T00:00:00.000Z",
        expectedVersion: null,
      },
      "server-key",
    );
    expect(request.mock.calls[0]![0]).toMatchObject({
      method: "POST",
      body: {
        planId: id,
        effectiveFrom: "2026-08-10T00:00:00.000Z",
        expectedVersion: null,
      },
      idempotencyKey: "server-key",
    });
    expect(
      JSON.stringify((request.mock.calls[0]![0] as { body: unknown }).body),
    ).not.toMatch(/commissionAmount|patient|currency/u);
  });
});
