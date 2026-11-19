import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Locale } from "@/i18n";
import { BackendAppointmentRepository } from "@/features/appointments/data/backend-appointment-repository";
import { BackendQueueRepository } from "@/features/live-queue/data/backend-queue-repository";
import { BackendApiClient } from "./api/api-client";
import { PortalApiError, safeApiMessage } from "./api/api-error";
import { authenticationComposition } from "./auth/composition";
import { portalSessionCookieName } from "./auth/session-cookie";
import { accessTokenNeedsRefresh } from "./auth/session-time";
import { portalConfiguration } from "./config/environment";

const doctorRecord = z
  .object({
    id: z.string().uuid(),
    displayName: z.string(),
    specialty: z.string().nullable().optional(),
    clinics: z.array(z.object({ id: z.string().uuid(), name: z.string() }).passthrough()),
  })
  .passthrough();
export type DoctorRecord = z.infer<typeof doctorRecord>;

const profileRecord = z
  .object({
    id: z.string().uuid(),
    displayName: z.string(),
    specialty: z.string().nullable().optional(),
    licenseNumber: z.string().nullable().optional(),
    yearsOfExperience: z.number().int().nullable().optional(),
    biography: z.string().nullable().optional(),
    languages: z.array(z.string()).optional(),
    gender: z.string().nullable().optional(),
    fees: z
      .object({ firstVisitIqd: z.number().int(), followUpIqd: z.number().int() })
      .passthrough()
      .optional(),
  })
  .passthrough();
export type DoctorProfile = z.infer<typeof profileRecord>;

const period = z.object({ weekday: z.number().int().min(0).max(6), startsAt: z.string(), endsAt: z.string() }).passthrough();
export const scheduleRecord = z
  .object({
    doctorId: z.string().uuid(),
    clinics: z.array(
      z
        .object({
          clinicId: z.string().uuid(),
          clinicName: z.string(),
          timezone: z.string(),
          clinicWorkingHours: z.array(period).optional(),
          weeklyWorkingHours: z.array(period).optional(),
          breaks: z.array(period).optional(),
          leave: z.array(z.object({ startsAt: z.string(), endsAt: z.string() }).passthrough()).optional(),
          holidays: z.array(z.object({ startsAt: z.string(), endsAt: z.string() }).passthrough()).optional(),
        })
        .passthrough(),
    ),
  })
  .passthrough();
export type DoctorSchedule = z.infer<typeof scheduleRecord>;

/** Server-side services for the signed-in doctor's own workspace. */
export async function doctorComposition(locale?: Locale) {
  const auth = authenticationComposition();
  const sealed = (await cookies()).get(portalSessionCookieName(auth.configuration.environment))?.value;
  const session = await auth.cookie.unseal(sealed);
  if (!session) {
    if (locale) redirect(`/${locale}/login`);
    throw failure("unauthorized", 401);
  }
  if (accessTokenNeedsRefresh(session)) {
    if (locale) redirect(`/api/auth/continue?returnPath=/${locale}/doctor/session`);
    throw failure("unauthorized", 401);
  }
  if (session.role !== "doctor" || !session.context) throw failure("forbidden", 403);
  const api = new BackendApiClient(portalConfiguration());
  const get = <T,>(path: `/api/v1/${string}`, schema: z.ZodType<T>) =>
    api.request({ path, session, schema }).then((result) => result.data);
  return Object.freeze({
    context: session.context,
    appointments: new BackendAppointmentRepository(api, session),
    queues: new BackendQueueRepository(api, session),
    me: () => get("/api/v1/doctors/me", doctorRecord),
    profile: (doctorId: string) =>
      get(`/api/v1/doctors/${encodeURIComponent(doctorId)}/profile`, profileRecord),
    schedule: (doctorId: string, clinicId: string) =>
      get(
        `/api/v1/doctors/${encodeURIComponent(doctorId)}/schedule?clinicId=${encodeURIComponent(clinicId)}`,
        scheduleRecord,
      ),
  });
}

function failure(kind: "unauthorized" | "forbidden", status: number) {
  return new PortalApiError({
    kind,
    status,
    code: kind === "unauthorized" ? "PORTAL_SESSION_REQUIRED" : "PORTAL_DOCTOR_ACCESS_FORBIDDEN",
    message: kind === "unauthorized" ? safeApiMessage.unauthorized : safeApiMessage.forbidden,
    retryable: false,
  });
}
