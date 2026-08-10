import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
const root = resolve(process.cwd(), "src");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
function files(path: string): string[] {
  return readdirSync(path).flatMap((name) => {
    const full = join(path, name);
    return statSync(full).isDirectory() ? files(full) : [full];
  });
}

describe("Sprint 13S-B administration boundaries", () => {
  it("keeps adapter, session and composition server-only", () => {
    for (const file of [
      "features/administration/data/backend-administration-repository.ts",
      "infrastructure/administration-composition.ts",
      "infrastructure/auth/platform-administrator-context.ts",
      "app/api/administration-request.ts",
    ])
      expect(read(file)).toContain('import "server-only"');
  });
  it("has no production mock, static fixture, generic proxy, or client token path", () => {
    const source = files(resolve(root, "features/administration"))
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");
    expect(source).not.toMatch(
      /MockAdministration|mock-administration|\/api\/backend|localStorage|sessionStorage/u,
    );
    expect(source).not.toMatch(/"use client"/u);
    expect(read("infrastructure/administration-composition.ts")).toContain(
      "BackendAdministrationRepository",
    );
  });
  it("protects every administration mutation and never forwards browser tenant headers", () => {
    for (const file of [
      "app/api/administration/organizations/route.ts",
      "app/api/administration/clinics/route.ts",
    ]) {
      const source = read(file);
      expect(source).toContain("isSameOriginMutation");
      expect(source).toContain("administrationOperationKey");
      expect(source).not.toMatch(/request\.headers\.get\(["']idempotency-key/u);
    }
    expect(read("app/api/administration-request.ts")).toContain(
      "forbiddenTenantHeaders",
    );
  });
  it("preserves platform-admin-only route policy", () => {
    const policy = read("features/portal-foundation/domain/route-policy.ts");
    for (const route of ["administration", "organizations", "clinics"])
      expect(policy).toMatch(
        new RegExp(
          `id:\"${route}\"[^\\n]+roles:\\[\"platformAdministrator\"\\]`,
          "u",
        ),
      );
  });
});
