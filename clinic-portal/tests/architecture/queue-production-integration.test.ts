import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
const read = (p: string) =>
  readFileSync(resolve(process.cwd(), "src", p), "utf8");
describe("Sprint 13M-C architecture", () => {
  it("keeps tokens and tenant headers server-only", () => {
    for (const p of [
      "features/live-queue/data/backend-doctor-directory.ts",
      "features/live-queue/data/backend-queue-repository.ts",
    ])
      expect(read(p)).toContain('import "server-only"');
    expect(
      read("features/live-queue/presentation/production-queue-workspace.tsx"),
    ).not.toMatch(/accessToken|refreshToken|x-organization-id|x-clinic-id/u);
  });
  it("binds both queue BFF routes to the exact sealed-session clinical roles", () => {
    const boundary = read("infrastructure/auth/authenticated-context.ts");
    expect(boundary).toContain('["receptionist", "clinicManager"]');
    expect(boundary).toContain("session.context");
    expect(read("infrastructure/clinical-composition.ts")).toContain(
      "requireClinicalSession",
    );
    for (const route of [
      "app/api/queue/commands/route.ts",
      "app/api/queue/entries/route.ts",
    ]) {
      const source = read(route);
      expect(source).toContain("clinicalComposition()");
      expect(source).not.toMatch(
        /organizationId:\s*z|clinicId:\s*z|x-organization-id|x-clinic-id/u,
      );
    }
  });
  it("removes production mock routing and consultation controls", () => {
    const source =
      read("app/[locale]/live-queue/page.tsx") +
      read("app/api/queue/commands/route.ts");
    expect(source).not.toMatch(
      /@portal-composition|liveQueueServices|MockLiveQueue|start-consultation|complete-consultation/u,
    );
  });
  it("contains no sensitive staff fields or mojibake", () => {
    for (const p of [
      "features/live-queue/data/backend-queue-repository.ts",
      "features/live-queue/presentation/production-messages.ts",
      "features/live-queue/presentation/production-queue-workspace.tsx",
      "app/api/queue/commands/route.ts",
    ])
      expect(read(p), p).not.toMatch(
        /phone|dateOfBirth|address|appointmentReason|â|Ã|Ø|Ù|�|\u0393\u00c7|\u252c\u2556/u,
      );
  });
});
