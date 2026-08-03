import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
const read = (path: string) =>
  readFileSync(resolve(process.cwd(), "src", path), "utf8");
describe("Sprint 13M-B architecture", () => {
  it("keeps arrival tokens server-only and tenant headers out of browser code", () => {
    expect(
      read("features/arrivals/data/backend-arrival-repository.ts"),
    ).toContain('import "server-only"');
    expect(
      read("features/arrivals/presentation/arrival-workspace.tsx"),
    ).not.toMatch(/accessToken|refreshToken|x-organization-id|x-clinic-id/u);
  });
  it("fails closed to the receptionist and clinic-manager roles", () => {
    const context = read("infrastructure/auth/authenticated-context.ts");
    expect(context).toContain('["receptionist", "clinicManager"]');
    expect(context).not.toMatch(/\["receptionist", "clinicManager", "doctor"/u);
  });
  it("uses production clinical composition without mock fallback", () => {
    const composition = read("infrastructure/clinical-composition.ts"),
      page = read("app/[locale]/appointments/[appointmentId]/arrival/page.tsx"),
      route = read("app/api/appointments/[appointmentId]/arrival/route.ts");
    expect(composition).toContain("BackendArrivalRepository");
    expect(`${composition}${page}${route}`).not.toMatch(
      /MockAppointment|mock-appointments|appointmentServices|@portal-composition/u,
    );
  });
  it("keeps new arrival production sources free of mojibake", () => {
    for (const path of [
      "features/arrivals/data/backend-arrival-repository.ts",
      "features/arrivals/presentation/messages.ts",
      "features/arrivals/presentation/arrival-workspace.tsx",
      "app/api/appointments/[appointmentId]/arrival/route.ts",
      "app/[locale]/appointments/[appointmentId]/arrival/page.tsx",
    ])
      expect(read(path), path).not.toMatch(/â|Ã|Ø|Ù|ΓÇ|├|┬|�/u);
  });
});
