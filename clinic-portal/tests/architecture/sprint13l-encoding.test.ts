import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
const files = [
  "src/app/[locale]/appointments/page.tsx",
  "src/app/[locale]/appointments/[appointmentId]/page.tsx",
  "src/app/[locale]/patients/page.tsx",
  "src/app/[locale]/patients/[patientId]/page.tsx",
  "src/app/api/clinical-request.ts",
  "src/app/api/appointments/[appointmentId]/cancel/route.ts",
  "src/app/api/appointments/[appointmentId]/reschedule/route.ts",
  "src/app/api/patients/search/route.ts",
  "src/features/appointments/data/backend-appointment-repository.ts",
  "src/features/appointments/domain/appointment-filter-contract.ts",
  "src/features/appointments/presentation/appointment-mutations.tsx",
  "src/features/appointments/presentation/appointments-page.tsx",
  "src/features/appointments/presentation/appointment-workspace.tsx",
  "src/features/clinical-presentation/clinical-state.tsx",
  "src/features/clinical-presentation/messages.ts",
  "src/features/patients/data/backend-patient-directory-repository.ts",
  "src/features/patients/presentation/patient-directory-detail.tsx",
  "src/features/patients/presentation/patient-directory-page.tsx",
  "src/infrastructure/auth/authenticated-context.ts",
  "src/infrastructure/clinical-composition.ts",
];
describe("Sprint 13L-B encoding", () => {
  it("contains no known mojibake markers", () => {
    for (const file of files)
      expect(
        readFileSync(resolve(process.cwd(), file), "utf8"),
        file,
      ).not.toMatch(/ΓÇö|├ù|┬╖|�|â|Ã/u);
  });
});
