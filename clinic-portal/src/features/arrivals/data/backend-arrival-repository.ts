import "server-only";

import { z } from "zod";
import type { AuthenticatedSession } from "@/features/authentication/domain/auth-models";
import type { BackendApiClient } from "@/infrastructure/api/api-client";

export const arrivalStatusSchema = z.enum([
  "expected",
  "arrived",
  "queueReady",
]);
export const backendArrivalSchema = z
  .object({
    id: z.string().uuid(),
    appointmentId: z.string().uuid(),
    appointmentReference: z.string().min(1).max(128),
    clinicId: z.string().uuid(),
    clinicName: z.string().min(1),
    doctorId: z.string().uuid(),
    doctorName: z.string().min(1),
    patientProfileId: z.string().uuid(),
    patientName: z.string().min(1),
    appointmentStartsAt: z.string().datetime({ offset: true }),
    status: arrivalStatusSchema,
    arrivedAt: z.string().datetime({ offset: true }).nullable(),
    queueReadyAt: z.string().datetime({ offset: true }).nullable(),
    version: z.number().int().min(1),
  })
  .strict();

export type BackendArrival = Readonly<z.infer<typeof backendArrivalSchema>>;

export class BackendArrivalRepository {
  constructor(
    private readonly api: BackendApiClient,
    private readonly session: AuthenticatedSession,
  ) {}

  async get(appointmentId: string): Promise<BackendArrival> {
    return (
      await this.api.request({
        path: `/api/v1/appointments/${encodeURIComponent(appointmentId)}/arrival`,
        session: this.session,
        schema: backendArrivalSchema,
      })
    ).data;
  }

  async record(
    appointmentId: string,
    version: number,
    idempotencyKey: string,
  ): Promise<BackendArrival> {
    return (
      await this.api.request({
        path: `/api/v1/appointments/${encodeURIComponent(appointmentId)}/arrival`,
        method: "POST",
        session: this.session,
        idempotencyKey,
        body: { version },
        schema: backendArrivalSchema,
      })
    ).data;
  }
}
