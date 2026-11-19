import "server-only";
import { z } from "zod";
import type { BackendApiClient } from "@/infrastructure/api/api-client";
import type { AuthenticatedSession } from "@/features/authentication/domain/auth-models";

const period = z
  .object({
    weekday: z.number().int().min(0).max(6),
    startsMinute: z.number().int().min(0).max(1440),
    endsMinute: z.number().int().min(0).max(1440),
  })
  .strict();

const viewSchema = z
  .object({
    doctorId: z.string().uuid(),
    displayName: z.string(),
    specialties: z.array(z.object({ en: z.string(), ar: z.string().nullable(), ku: z.string().nullable() }).strict()),
    clinicId: z.string().uuid(),
    clinicName: z.string(),
    timezone: z.string(),
    openingHours: z.array(period),
    weekly: z.array(period),
    breaks: z.array(period),
    elsewhere: z.array(period),
    leave: z.array(z.object({ id: z.string().uuid(), startsAt: z.string(), endsAt: z.string() }).strict()),
    visitMinutes: z.number().int().nullable(),
    defaultVisitMinutes: z.number().int(),
    bookable: z.boolean(),
    acceptingNewPatients: z.boolean(),
    nextAvailableAt: z.string().nullable(),
    biography: z.string(),
    yearsOfExperience: z.number().int(),
    languages: z.array(z.string()),
    consultationFeeIqd: z.number().int().nullable(),
    followUpFeeIqd: z.number().int().nullable(),
    defaultFeeIqd: z.number().int(),
  })
  .strict();
export type DoctorSettingsView = Readonly<z.infer<typeof viewSchema>>;

const leaveResultSchema = z.object({ ids: z.array(z.string().uuid()), bookedVisits: z.number().int().min(0) }).strict();

export type WeekBody = { weekly: z.infer<typeof period>[]; breaks: z.infer<typeof period>[] };
export type BookingBody = { visitMinutes: number | null; bookable: boolean; acceptingNewPatients: boolean };
export type DetailsBody = {
  biography?: string;
  yearsOfExperience?: number;
  languages?: string[];
  consultationFeeIqd?: number | null;
  followUpFeeIqd?: number | null;
};

const doctorPath = (doctorId: string) => `/api/v1/clinic/doctors/${encodeURIComponent(doctorId)}` as const;

/**
 * Clinic Portal → Doctors → a doctor: reception runs the hours, time off,
 * booking switches, fees and profile of the doctors they work for.
 */
export class BackendDoctorSettings {
  constructor(
    private readonly api: BackendApiClient,
    private readonly session: AuthenticatedSession,
  ) {}

  async view(doctorId: string): Promise<DoctorSettingsView> {
    return (
      await this.api.request({ path: `${doctorPath(doctorId)}/settings`, session: this.session, schema: viewSchema })
    ).data;
  }

  async setWeek(doctorId: string, body: WeekBody) {
    await this.api.request({ path: `${doctorPath(doctorId)}/hours`, method: "PUT", session: this.session, body });
  }

  async addLeave(doctorId: string, body: { startsAt: string; endsAt: string }) {
    return (
      await this.api.request({
        path: `${doctorPath(doctorId)}/leave`,
        method: "POST",
        session: this.session,
        body,
        schema: leaveResultSchema,
      })
    ).data;
  }

  async removeLeave(doctorId: string, leaveId: string) {
    await this.api.request({
      path: `${doctorPath(doctorId)}/leave/${encodeURIComponent(leaveId)}`,
      method: "DELETE",
      session: this.session,
    });
  }

  async setBooking(doctorId: string, body: BookingBody) {
    await this.api.request({ path: `${doctorPath(doctorId)}/booking`, method: "PUT", session: this.session, body });
  }

  async setDetails(doctorId: string, body: DetailsBody) {
    await this.api.request({ path: `${doctorPath(doctorId)}/details`, method: "PUT", session: this.session, body });
  }

  async setOpeningHours(periods: WeekBody["weekly"]) {
    await this.api.request({ path: "/api/v1/clinic/opening-hours", method: "PUT", session: this.session, body: { periods } });
  }
}
