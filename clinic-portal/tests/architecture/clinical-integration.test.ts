import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import { describe, expect, it } from "vitest";
const root = resolve(process.cwd(), "src"),
  read = (p: string) => readFileSync(resolve(root, p), "utf8");
function files(path: string): string[] {
  return readdirSync(path).flatMap((name) => {
    const full = join(path, name);
    return statSync(full).isDirectory() ? files(full) : [full];
  });
}
describe("Sprint 13L-B boundaries", () => {
  it("uses real server-only adapters", () => {
    for (const file of [
      "features/appointments/data/backend-appointment-repository.ts",
      "features/patients/data/backend-patient-directory-repository.ts",
      "infrastructure/clinical-composition.ts",
    ])
      expect(read(file)).toContain('import "server-only"');
    expect(read("app/[locale]/appointments/page.tsx")).toContain("clinicalComposition");
    expect(read("app/api/patients/search/route.ts")).toContain("clinicalComposition");
  });
  it("keeps tokens and mocks out of clinical client modules", () => {
    for (const file of files(resolve(root, "features")).filter(
      (x) =>
        x.endsWith(".tsx") && readFileSync(x, "utf8").includes('"use client"'),
    )) {
      const source = readFileSync(file, "utf8");
      expect(source).not.toMatch(
        /accessToken|refreshToken|MockAppointment|MockPatient/u,
      );
    }
  });
  it("protects mutations with origin checks and idempotency", () => {
    for (const file of [
      "app/api/appointments/[appointmentId]/cancel/route.ts",
      "app/api/appointments/[appointmentId]/reschedule/route.ts",
    ]) {
      const source = read(file);
      expect(source).toContain("isSameOriginMutation");
      expect(source).toContain("operationId");
    }
  });
});
