// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetPortalConfigurationForTests } from "@/infrastructure/config/environment";

const services = {
  listOrganizations: vi.fn(),
  getOrganization: vi.fn(),
  createOrganization: vi.fn(),
  listClinics: vi.fn(),
  getClinic: vi.fn(),
  createClinic: vi.fn(),
};
const session = {
  userId: "00000000-0000-4000-8000-000000000001",
  sessionId: "00000000-0000-4000-8000-000000000002",
  role: "platformAdministrator",
  context: null,
};
vi.mock("@/infrastructure/administration-composition", () => ({
  administrationComposition: vi.fn(async () => ({ services, session })),
}));

import {
  GET as getOrganizations,
  POST as createOrganization,
} from "@/app/api/administration/organizations/route";
import { GET as getOrganization } from "@/app/api/administration/organizations/[organizationId]/route";
import {
  GET as getClinics,
  POST as createClinic,
} from "@/app/api/administration/clinics/route";
import { GET as getClinic } from "@/app/api/administration/clinics/[clinicId]/route";

const origin = "https://portal.saxlem.test";
const id = "00000000-0000-4000-8000-000000000003";
const attemptId = "00000000-0000-4000-8000-000000000004";
const request = (path: string, init?: RequestInit) =>
  new Request(`${origin}${path}`, init);

describe("administration BFF routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("SAXLEM_PORTAL_ENV", "development");
    vi.stubEnv("SAXLEM_BACKEND_API_URL", "http://localhost:3000/");
    vi.stubEnv(
      "SAXLEM_PORTAL_SESSION_SECRET",
      Buffer.from("0123456789abcdef0123456789abcdef").toString("base64url"),
    );
    resetPortalConfigurationForTests();
    services.listOrganizations.mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    services.listClinics.mockResolvedValue({ items: [], nextCursor: null });
    services.getOrganization.mockResolvedValue({ id });
    services.getClinic.mockResolvedValue({ id });
    services.createOrganization.mockResolvedValue({ id });
    services.createClinic.mockResolvedValue({ id });
  });

  it("validates and forwards bounded list/detail requests", async () => {
    expect(
      (
        await getOrganizations(
          request("/api/administration/organizations?pageSize=25"),
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await getClinics(
          request(
            `/api/administration/clinics?pageSize=10&organizationId=${id}`,
          ),
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await getOrganization(
          request(`/api/administration/organizations/${id}`),
          { params: Promise.resolve({ organizationId: id }) },
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await getClinic(request(`/api/administration/clinics/${id}`), {
          params: Promise.resolve({ clinicId: id }),
        })
      ).status,
    ).toBe(200);
    expect(services.listClinics).toHaveBeenCalledWith({
      pageSize: 10,
      organizationId: id,
    });
  });

  it.each(["0", "101", "text"])(
    "rejects invalid page size %s",
    async (pageSize) => {
      expect(
        (
          await getOrganizations(
            request(`/api/administration/organizations?pageSize=${pageSize}`),
          )
        ).status,
      ).toBe(400);
      expect(services.listOrganizations).not.toHaveBeenCalled();
    },
  );

  it("rejects invalid cursors, UUIDs and unknown query fields", async () => {
    expect(
      (
        await getOrganizations(
          request("/api/administration/organizations?cursor=bad%20cursor"),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await getOrganizations(
          request("/api/administration/organizations?unknown=true"),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await getOrganization(
          request("/api/administration/organizations/bad"),
          { params: Promise.resolve({ organizationId: "bad" }) },
        )
      ).status,
    ).toBe(400);
  });

  it("enforces same-origin, strict JSON, and derives opaque backend keys", async () => {
    const body = JSON.stringify({ name: "Saxlem", attemptId });
    const valid = request("/api/administration/organizations", {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body,
    });
    expect((await createOrganization(valid)).status).toBe(201);
    const key = services.createOrganization.mock.calls[0]![1] as string;
    expect(key).toMatch(/^portal-admin-[0-9a-f]{64}$/u);
    expect(key).not.toContain(attemptId);
    expect(
      (
        await createOrganization(
          request("/api/administration/organizations", {
            method: "POST",
            headers: {
              origin: "https://evil.test",
              "content-type": "application/json",
            },
            body,
          }),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await createOrganization(
          request("/api/administration/organizations", {
            method: "POST",
            headers: { origin, "content-type": "text/plain" },
            body,
          }),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await createOrganization(
          request("/api/administration/organizations", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body,
          }),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await createOrganization(
          request("/api/administration/organizations", {
            method: "POST",
            headers: {
              origin,
              "sec-fetch-site": "cross-site",
              "content-type": "application/json",
            },
            body,
          }),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await createOrganization(
          request("/api/administration/organizations", {
            method: "POST",
            headers: { origin, "content-type": "application/json" },
            body: "{",
          }),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await createOrganization(
          request("/api/administration/organizations", {
            method: "POST",
            headers: { origin, "content-type": "application/json" },
            body: JSON.stringify({
              name: "Saxlem",
              attemptId,
              role: "platformAdministrator",
            }),
          }),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await createOrganization(
          request("/api/administration/organizations", {
            method: "POST",
            headers: { origin, "content-type": "application/json" },
            body: JSON.stringify({
              name: "x".repeat(16_385),
              attemptId,
            }),
          }),
        )
      ).status,
    ).toBe(400);
  });

  it("preserves one key for an unchanged attempt and changes it with content", async () => {
    for (const name of ["Saxlem", "Saxlem", "Different"]) {
      await createOrganization(
        request("/api/administration/organizations", {
          method: "POST",
          headers: { origin, "content-type": "application/json" },
          body: JSON.stringify({ name, attemptId }),
        }),
      );
    }
    const keys = services.createOrganization.mock.calls.map((call) => call[1]);
    expect(keys[0]).toBe(keys[1]);
    expect(keys[2]).not.toBe(keys[0]);
  });

  it("accepts organizationId only as validated clinic input and rejects tenant headers", async () => {
    const body = JSON.stringify({
      organizationId: id,
      name: "Duhok",
      code: "dhk_1",
      timezone: "Asia/Baghdad",
      attemptId,
    });
    const response = await createClinic(
      request("/api/administration/clinics", {
        method: "POST",
        headers: { origin, "content-type": "application/json" },
        body,
      }),
    );
    expect(response.status).toBe(201);
    expect(services.createClinic.mock.calls[0]![0]).toMatchObject({
      organizationId: id,
      code: "DHK_1",
    });
    for (const header of [
      "x-organization-id",
      "x-clinic-id",
      "organizationid",
      "clinicid",
    ]) {
      expect(
        (
          await getOrganizations(
            request("/api/administration/organizations", {
              headers: { [header]: id },
            }),
          )
        ).status,
      ).toBe(400);
    }
  });

  it("ignores hostile identity headers and keeps authority in the sealed session", async () => {
    const response = await getOrganizations(
      request("/api/administration/organizations?pageSize=25", {
        headers: {
          authorization: "Bearer browser-controlled",
          "x-role": "platformAdministrator",
          "x-organization-scope": id,
          "x-clinic-scope": id,
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(services.listOrganizations).toHaveBeenCalledWith({ pageSize: 25 });
  });

  it("rejects invalid clinic fields and browser attempts to set an idempotency key", async () => {
    for (const body of [
      {
        organizationId: id,
        name: "Duhok",
        code: "?",
        timezone: "Asia/Baghdad",
        attemptId,
      },
      {
        organizationId: id,
        name: "Duhok",
        code: "DHK",
        timezone: "Baghdad",
        attemptId,
      },
      {
        organizationId: id,
        name: "Duhok",
        code: "DHK",
        timezone: "Asia/Baghdad",
        attemptId,
        idempotencyKey: "browser-key",
      },
    ]) {
      const response = await createClinic(
        request("/api/administration/clinics", {
          method: "POST",
          headers: { origin, "content-type": "application/json" },
          body: JSON.stringify(body),
        }),
      );
      expect(response.status).toBe(400);
    }
    expect(services.createClinic).not.toHaveBeenCalled();
  });
});
