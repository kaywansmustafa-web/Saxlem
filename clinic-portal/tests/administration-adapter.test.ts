// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import type { AuthenticatedSession } from "@/features/authentication/domain/auth-models";
import { BackendApiClient } from "@/infrastructure/api/api-client";
import { BackendAdministrationRepository } from "@/features/administration/data/backend-administration-repository";

const session = {
  userId: "00000000-0000-4000-8000-000000000001",
  sessionId: "00000000-0000-4000-8000-000000000002",
  role: "platformAdministrator",
  context: null,
  accessToken: "token",
  refreshToken: "refresh",
  deviceId: "device",
  deviceUserAgent: "agent",
  accessExpiresAt: Date.now() + 60000,
  sessionExpiresAt: Date.now() + 60000,
} satisfies AuthenticatedSession;
const organization = {
  id: "00000000-0000-4000-8000-000000000003",
  name: "Saxlem",
  status: "active",
  createdAt: "2026-08-10T10:00:00.000Z",
  updatedAt: "2026-08-10T10:00:00.000Z",
};
const clinic = {
  id: "00000000-0000-4000-8000-000000000004",
  organizationId: organization.id,
  name: "Duhok",
  code: "DHK",
  timezone: "Asia/Baghdad",
  status: "active",
  createdAt: organization.createdAt,
  updatedAt: organization.updatedAt,
};

describe("BackendAdministrationRepository", () => {
  it("uses exact routes, server session and mutation idempotency without tenant scope", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce({
        data: { items: [organization], nextCursor: null },
      })
      .mockResolvedValueOnce({ data: organization })
      .mockResolvedValueOnce({ data: organization })
      .mockResolvedValueOnce({ data: { items: [clinic], nextCursor: null } })
      .mockResolvedValueOnce({ data: clinic })
      .mockResolvedValueOnce({ data: clinic });
    const repository = new BackendAdministrationRepository(
      { request } as unknown as BackendApiClient,
      session,
    );
    await repository.listOrganizations({ pageSize: 25 });
    await repository.getOrganization(organization.id);
    await repository.createOrganization({ name: "Saxlem" }, "server-key");
    await repository.listClinics({
      pageSize: 10,
      organizationId: organization.id,
    });
    await repository.getClinic(clinic.id);
    await repository.createClinic(
      {
        organizationId: organization.id,
        name: "Duhok",
        code: "DHK",
        timezone: "Asia/Baghdad",
      },
      "server-clinic-key",
    );
    expect(request.mock.calls.map(([input]) => input.path)).toEqual([
      "/api/v1/administration/organizations?pageSize=25",
      `/api/v1/administration/organizations/${organization.id}`,
      "/api/v1/administration/organizations",
      `/api/v1/administration/clinics?pageSize=10&organizationId=${organization.id}`,
      `/api/v1/administration/clinics/${clinic.id}`,
      "/api/v1/administration/clinics",
    ]);
    expect(
      request.mock.calls.every(([input]) => input.session === session),
    ).toBe(true);
    expect(request.mock.calls[2]![0]).toMatchObject({
      idempotencyKey: "server-key",
      body: { name: "Saxlem" },
    });
    expect(request.mock.calls[5]![0]).toMatchObject({
      idempotencyKey: "server-clinic-key",
    });
  });
  it("fails closed on malformed backend data", async () => {
    const api = {
      request: vi.fn().mockRejectedValue(new Error("invalid response")),
    } as unknown as BackendApiClient;
    await expect(
      new BackendAdministrationRepository(api, session).getOrganization(
        organization.id,
      ),
    ).rejects.toThrow("invalid response");
  });

  it("adds authorization server-side without tenant headers for a global administrator", async () => {
    const transport = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ items: [organization], nextCursor: null }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      );
    const api = new BackendApiClient(
      {
        backendApiUrl: new URL("https://api.saxlem.test"),
        requestTimeoutMs: 1000,
      },
      transport,
    );

    await new BackendAdministrationRepository(api, session).listOrganizations({
      pageSize: 25,
    });

    const headers = new Headers(transport.mock.calls[0]![1]?.headers);
    expect(headers.get("authorization")).toBe("Bearer token");
    expect(headers.has("x-organization-id")).toBe(false);
    expect(headers.has("x-clinic-id")).toBe(false);
  });
});
