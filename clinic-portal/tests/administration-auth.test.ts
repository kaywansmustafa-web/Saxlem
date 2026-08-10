// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ unseal: vi.fn(), cookies: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("@/infrastructure/auth/composition", () => ({
  authenticationComposition: () => ({
    configuration: { environment: "production" },
    cookie: { unseal: mocks.unseal },
  }),
}));
import { requirePlatformAdministratorSession } from "@/infrastructure/auth/platform-administrator-context";

const base = {
  userId: "00000000-0000-4000-8000-000000000001",
  sessionId: "00000000-0000-4000-8000-000000000002",
  role: "platformAdministrator",
  context: null,
  accessExpiresAt: Date.now() + 120000,
};
describe("platform administrator session boundary", () => {
  beforeEach(() => {
    mocks.cookies.mockResolvedValue({ get: () => ({ value: "sealed" }) });
    mocks.unseal.mockResolvedValue(base);
  });
  it("allows only a current global platform-administrator session", async () => {
    await expect(requirePlatformAdministratorSession()).resolves.toMatchObject({
      role: "platformAdministrator",
      context: null,
    });
  });
  it.each([
    null,
    {
      ...base,
      role: "receptionist",
      context: { organizationId: "o", clinicId: "c" },
    },
    {
      ...base,
      role: "doctor",
      context: { organizationId: "o", clinicId: "c" },
    },
    {
      ...base,
      role: "clinicManager",
      context: { organizationId: "o", clinicId: "c" },
    },
    {
      ...base,
      role: "platformAdministrator",
      context: { organizationId: "o", clinicId: "c" },
    },
  ])(
    "rejects missing or non-global administrator session %#",
    async (value) => {
      mocks.unseal.mockResolvedValue(value);
      await expect(requirePlatformAdministratorSession()).rejects.toMatchObject(
        { detail: { status: value ? 403 : 401 } },
      );
    },
  );
  it("rejects an expired access session", async () => {
    mocks.unseal.mockResolvedValue({
      ...base,
      accessExpiresAt: Date.now() - 1,
    });
    await expect(requirePlatformAdministratorSession()).rejects.toMatchObject({
      detail: { status: 401 },
    });
  });
});
