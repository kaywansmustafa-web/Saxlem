import { describe, expect, it } from "vitest";
import {
  allowed,
  landingRoute,
  navigationFor,
  routePath,
  routePolicies,
  safeRoleReturnPath,
} from "@/features/portal-foundation/domain/route-policy";
import { safeReturnPath } from "@/infrastructure/auth/session-cookie";
import type { PortalStaffRole } from "@/features/authentication/domain/portal-access-types";

const roles: readonly PortalStaffRole[] = ["receptionist", "doctor", "clinicManager", "platformAdministrator"];

describe("Sprint 13K-C protected route matrix", () => {
  for (const policy of routePolicies) {
    it(`certifies ${policy.id}`, () => {
      for (const role of roles) {
        const expected = policy.roles.includes(role);
        expect(allowed(policy.id, role)).toBe(expected);
        expect(navigationFor(role).some((item) => item.id === policy.id)).toBe(expected && policy.navigation);
        expect(safeRoleReturnPath(routePath("ar", policy.id), role)).toBe(
          expected ? routePath("ar", policy.id) : landingRoute("ar", role),
        );
      }
      expect(policy.placeholder).toBe(true);
      expect(policy.owner).toMatch(/^Sprint 13/u);
    });
  }

  it("has a manifest entry for every policy and unique direct URL", () => {
    expect(new Set(routePolicies.map((item) => item.id)).size).toBe(routePolicies.length);
    expect(new Set(routePolicies.map((item) => item.segment)).size).toBe(routePolicies.length);
  });

  it.each(["//evil.test", "https://evil.test", "/api/auth/login", "/en\\dashboard", "/en/%00", `/${"a".repeat(600)}`])(
    "rejects unsafe return path %s",
    (candidate) => expect(safeReturnPath(candidate, "/ku/login")).toBe("/ku/login"),
  );

  it("preserves safe query encoding once and blocks cross-role targets", () => {
    expect(safeReturnPath("/en/dashboard?from=a%20b")).toBe("/en/dashboard?from=a%20b");
    expect(safeRoleReturnPath("/en/dashboard?from=a%20b", "receptionist")).toBe("/en/dashboard?from=a%20b");
    expect(safeRoleReturnPath("/en/doctor/session", "receptionist")).toBe("/en/dashboard");
    expect(safeRoleReturnPath("/ku/appointments", "doctor")).toBe("/ku/doctor/session");
  });
});
