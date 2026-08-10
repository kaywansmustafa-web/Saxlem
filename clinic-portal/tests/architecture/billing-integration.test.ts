import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const root = resolve(process.cwd(), "src"),
  read = (path: string) => readFileSync(resolve(root, path), "utf8");
describe("billing integration architecture", () => {
  it("keeps tokens and backend billing calls server-only", () => {
    expect(
      read("features/billing/data/backend-billing-repository.ts"),
    ).toContain('import "server-only"');
    expect(read("infrastructure/billing-composition.ts")).toContain(
      'import "server-only"',
    );
    expect(
      read("features/billing/data/backend-billing-repository.ts"),
    ).toContain("/api/v1/billing/");
  });
  it("contains no payment/provider or clinical billing data", () => {
    const source = [
      read("features/billing/domain/models.ts"),
      read("features/billing/domain/repository.ts"),
    ].join("\n");
    expect(source).not.toMatch(
      /stripe|paypal|fastpay|fib|card|bank|diagnosis|patientName|phone|appointmentReason/iu,
    );
  });
  it("exposes billing navigation only to managers and platform administrators", () => {
    const source = read("features/portal-foundation/domain/route-policy.ts");
    expect(source).toMatch(
      /id:\s*"billing"[\s\S]*?roles:\s*\["clinicManager",\s*"platformAdministrator"\]/u,
    );
  });
  it("has no production billing mock or client-side backend request", () => {
    const production = read("infrastructure/composition/production.ts");
    expect(production).not.toMatch(/Billing|STANDARD_1250/u);
    expect(read("app/[locale]/billing/page.tsx")).not.toContain(
      "/api/v1/billing",
    );
  });
  it("keeps billing presentation behind same-origin BFF routes and free of financial persistence", () => {
    const source = read("features/billing/presentation/billing-workspace.tsx");
    expect(source).not.toMatch(
      /https?:\/\/|authorization|bearer|x-organization|x-clinic/iu,
    );
    expect(source).not.toMatch(
      /localStorage|sessionStorage|indexedDB|dangerouslySetInnerHTML/u,
    );
    expect(source).not.toMatch(
      /stripe|paypal|fastpay|checkout|payment provider/iu,
    );
    expect(source).toContain("/api/billing/");
    expect(source).toContain("expectedVersion: statement.version");
    expect(source).toContain("finalizeAttempt.current");
    expect(source).toContain("if (pending) return");
  });
  it("contains no known encoding corruption in billing production source", () => {
    const source = [
      read("features/billing/presentation/billing-workspace.tsx"),
      read("features/billing/presentation/messages.ts"),
      read("app/[locale]/billing/page.tsx"),
    ].join("\n");
    expect(source).not.toMatch(/Ã|â|ΓÇ|├|┬|�/u);
  });
});
