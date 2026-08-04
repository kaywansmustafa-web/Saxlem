import "server-only";
import { z } from "zod";
import type { AuthenticatedSession } from "@/features/authentication/domain/auth-models";
import type { BackendApiClient } from "@/infrastructure/api/api-client";
const clinic = z
  .object({ id: z.string().uuid(), name: z.string().min(1) })
  .strict();
const doctor = z
  .object({
    id: z.string().uuid(),
    displayName: z.string().min(1),
    fullName: z.string(),
    specialty: z.string(),
    gender: z.enum(["female", "male", "unspecified"]),
    status: z.enum(["active", "inactive"]),
    yearsOfExperience: z.number().int().nonnegative(),
    languages: z.array(z.string()),
    profileImageUrl: z.string().url().nullable(),
    clinics: z.array(clinic),
    availability: z
      .object({
        status: z.enum(["available", "unavailable"]),
        acceptingNewPatients: z.boolean(),
        nextAvailableAt: z.string().datetime({ offset: true }).nullable(),
        updatedAt: z.string().datetime({ offset: true }).nullable(),
      })
      .strict(),
  })
  .strict();
const page = z
  .object({
    items: z.array(doctor),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1).max(100),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  })
  .strict();
export type QueueDoctor = Readonly<{ id: string; displayName: string }>;
export class BackendDoctorDirectory {
  constructor(
    private api: BackendApiClient,
    private session: AuthenticatedSession,
  ) {}
  async list(clinicId: string): Promise<readonly QueueDoctor[]> {
    const doctors = new Map<string, QueueDoctor>();
    const maximumPages = 20;
    for (let pageNumber = 1; pageNumber <= maximumPages; pageNumber += 1) {
      const result = await this.api.request({
        path: `/api/v1/doctors?clinicId=${encodeURIComponent(clinicId)}&status=active&page=${pageNumber}&pageSize=100`,
        session: this.session,
        schema: page,
      });
      if (result.data.page !== pageNumber)
        throw new Error("Doctor directory returned a repeated or stale page.");
      for (const item of result.data.items) {
        if (
          item.status === "active" &&
          item.clinics.some((value) => value.id === clinicId)
        ) {
          doctors.set(
            item.id,
            Object.freeze({ id: item.id, displayName: item.displayName }),
          );
        }
      }
      if (pageNumber >= result.data.totalPages)
        return Object.freeze([...doctors.values()]);
    }
    throw new Error("Doctor directory exceeded its safe pagination bound.");
  }
}
