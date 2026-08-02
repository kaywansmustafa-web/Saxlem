import "server-only";

import { z } from "zod";
import type { AuthenticatedSession } from "@/features/authentication/domain/auth-models";
import type { BackendApiClient } from "@/infrastructure/api/api-client";
import { opaqueAppointmentCursorSchema } from "../domain/appointment-filter-contract";

export const appointmentStatusSchema = z.enum([
  "scheduled",
  "confirmed",
  "cancelled",
  "completed",
  "noShow",
]);
export type BackendAppointmentStatus = z.infer<typeof appointmentStatusSchema>;
export const backendAppointmentSchema = z
  .object({
    id: z.string().uuid(),
    reference: z.string(),
    clinicId: z.string().uuid(),
    clinicName: z.string(),
    doctorId: z.string().uuid(),
    doctorName: z.string(),
    patientProfileId: z.string().uuid(),
    patientName: z.string(),
    type: z.enum(["initial", "followUp"]),
    reason: z.string(),
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }),
    durationMinutes: z.number().int().min(1),
    feeIqd: z.number().int().nonnegative(),
    status: appointmentStatusSchema,
    cancellationReason: z.string().nullable().optional(),
    version: z.number().int().min(1),
  })
  .strict();
const pageSchema = z
  .object({
    items: z.array(backendAppointmentSchema),
    nextCursor: opaqueAppointmentCursorSchema.nullable().optional(),
  })
  .strict();
export type BackendAppointment = Readonly<
  z.infer<typeof backendAppointmentSchema>
>;
export interface AppointmentPage {
  readonly items: readonly BackendAppointment[];
  readonly nextCursor: string | null;
}
export interface AppointmentFilters {
  readonly from: string;
  readonly to: string;
  readonly status?: BackendAppointmentStatus;
  readonly cursor?: string;
  readonly pageSize?: number;
}

export class BackendAppointmentRepository {
  constructor(
    private readonly api: BackendApiClient,
    private readonly session: AuthenticatedSession,
  ) {}
  async list(filters: AppointmentFilters): Promise<AppointmentPage> {
    const query = new URLSearchParams({
      from: filters.from,
      to: filters.to,
      pageSize: String(filters.pageSize ?? 25),
    });
    if (filters.status) query.set("status", filters.status);
    if (filters.cursor)
      query.set("cursor", opaqueAppointmentCursorSchema.parse(filters.cursor));
    const result = await this.api.request({
      path: `/api/v1/appointments?${query}` as `/api/v1/${string}`,
      session: this.session,
      schema: pageSchema,
    });
    return Object.freeze({
      items: Object.freeze(result.data.items),
      nextCursor: result.data.nextCursor ?? null,
    });
  }
  async get(id: string): Promise<BackendAppointment> {
    return (
      await this.api.request({
        path: `/api/v1/appointments/${encodeURIComponent(id)}`,
        session: this.session,
        schema: backendAppointmentSchema,
      })
    ).data;
  }
  async cancel(
    id: string,
    input: { reason: string; version: number; idempotencyKey: string },
  ): Promise<BackendAppointment> {
    return (
      await this.api.request({
        path: `/api/v1/appointments/${encodeURIComponent(id)}/cancel`,
        method: "POST",
        session: this.session,
        idempotencyKey: input.idempotencyKey,
        body: { reason: input.reason, version: input.version },
        schema: backendAppointmentSchema,
      })
    ).data;
  }
  async reschedule(
    id: string,
    input: {
      startsAt: string;
      durationMinutes: number;
      version: number;
      idempotencyKey: string;
    },
  ): Promise<BackendAppointment> {
    return (
      await this.api.request({
        path: `/api/v1/appointments/${encodeURIComponent(id)}/reschedule`,
        method: "POST",
        session: this.session,
        idempotencyKey: input.idempotencyKey,
        body: {
          startsAt: input.startsAt,
          durationMinutes: input.durationMinutes,
          version: input.version,
        },
        schema: backendAppointmentSchema,
      })
    ).data;
  }
}
