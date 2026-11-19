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
    origin: z.enum(["patientBooked", "clinicCreated", "walkIn"]).optional(),
    reason: z.string(),
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }),
    durationMinutes: z.number().int().min(1),
    feeIqd: z.number().int().nonnegative(),
    status: appointmentStatusSchema,
    cancellationReason: z.string().nullable().optional(),
    version: z.number().int().min(1),
    // The patient said "I'm on my way": when they should reach reception.
    onTheWayEta: z.string().datetime({ offset: true }).nullable().optional(),
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

const slotSchema = z
  .object({
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }),
    durationMinutes: z.number().int().min(1),
  })
  .strict();
const slotsSchema = z
  .object({
    doctorId: z.string().uuid(),
    doctorName: z.string(),
    clinicId: z.string().uuid(),
    clinicTimezone: z.string(),
    durationMinutes: z.number().int().min(1),
    days: z.array(
      z.object({ date: z.string(), slots: z.array(slotSchema) }).strict(),
    ),
  })
  .passthrough();
export type BookingSlot = Readonly<z.infer<typeof slotSchema>>;
const originSchema = z.enum(["patientBooked", "clinicCreated", "walkIn"]);
const boardSchema = z
  .object({
    date: z.string(),
    clinicId: z.string().uuid(),
    clinicTimezone: z.string().min(1),
    durationMinutes: z.number().int().min(1),
    generatedAt: z.string().datetime({ offset: true }),
    doctors: z.array(
      z
        .object({
          doctorId: z.string().uuid(),
          doctorName: z.string(),
          slots: z.array(
            z
              .object({
                startsAt: z.string().datetime({ offset: true }),
                endsAt: z.string().datetime({ offset: true }),
                state: z.enum(["free", "booked", "unavailable", "past"]),
                walkIn: z.boolean(),
                appointment: z
                  .object({
                    id: z.string().uuid(),
                    reference: z.string(),
                    origin: originSchema,
                    status: appointmentStatusSchema,
                    patientName: z.string(),
                    onTheWayEta: z
                      .string()
                      .datetime({ offset: true })
                      .nullable()
                      .optional(),
                  })
                  .strict()
                  .nullable(),
              })
              .strict(),
          ),
        })
        .strict(),
    ),
  })
  .strict();
export type DayBoard = Readonly<z.infer<typeof boardSchema>>;
export interface DaySlots {
  readonly doctorName: string;
  readonly timezone: string;
  readonly durationMinutes: number;
  readonly slots: readonly BookingSlot[];
}
export interface ClinicBookingInput {
  readonly organizationId: string;
  readonly clinicId: string;
  readonly doctorId: string;
  readonly patientProfileId: string;
  readonly type: "initial" | "followUp";
  readonly reason: string;
  readonly startsAt: string;
  readonly durationMinutes: number;
  readonly walkIn: boolean;
  readonly idempotencyKey: string;
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
  /** Free slots for one doctor on one day. App, phone and walk-in bookings
   * all block the same slots, so the two channels never overlap. */
  async slots(input: {
    clinicId: string;
    doctorId: string;
    patientProfileId: string;
    type: "initial" | "followUp";
    date: string;
  }): Promise<DaySlots> {
    const query = new URLSearchParams({
      clinicId: input.clinicId,
      patientProfileId: input.patientProfileId,
      appointmentType: input.type,
      dateFrom: input.date,
      dateTo: input.date,
    });
    const result = await this.api.request({
      path: `/api/v1/doctors/${encodeURIComponent(input.doctorId)}/clinic-slots?${query}` as `/api/v1/${string}`,
      session: this.session,
      schema: slotsSchema,
    });
    return Object.freeze({
      doctorName: result.data.doctorName,
      timezone: result.data.clinicTimezone,
      durationMinutes: result.data.durationMinutes,
      slots: Object.freeze(result.data.days[0]?.slots ?? []),
    });
  }
  /** Every doctor's day at the signed-in clinic, slot by slot. */
  async board(date: string): Promise<DayBoard> {
    return (
      await this.api.request({
        path: `/api/v1/appointments/board?date=${encodeURIComponent(date)}` as `/api/v1/${string}`,
        session: this.session,
        schema: boardSchema,
      })
    ).data;
  }
  async create(input: ClinicBookingInput): Promise<BackendAppointment> {
    const { idempotencyKey, walkIn, ...body } = input;
    return (
      await this.api.request({
        path: "/api/v1/appointments",
        method: "POST",
        session: this.session,
        idempotencyKey,
        body: walkIn ? { ...body, walkIn: true } : body,
        schema: backendAppointmentSchema,
      })
    ).data;
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
