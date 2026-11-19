import "server-only";

import { z } from "zod";
import type { OwnerSession } from "@/domain/session";
import { ownerApi } from "@/infrastructure/auth";

const id = z.string().uuid();
const status = z.enum(["active", "inactive"]);

export const catalogSpecialtySchema = z.object({
  id,
  code: z.string(),
  nameEn: z.string(),
  nameAr: z.string().nullable(),
  nameKu: z.string().nullable(),
  icon: z.string(),
  showOnHome: z.boolean(),
  status,
  sortOrder: z.number().int(),
  activeDoctors: z.number().int(),
  tiles: z.array(z.object({ id, labelEn: z.string() })),
  updatedAt: z.string(),
});
export type CatalogSpecialty = z.infer<typeof catalogSpecialtySchema>;

export const catalogConcernSchema = z.object({
  id,
  labelEn: z.string(),
  labelAr: z.string(),
  labelKu: z.string(),
  icon: z.string(),
  tone: z.string(),
  status,
  sortOrder: z.number().int(),
  activeDoctors: z.number().int(),
  specialties: z.array(
    z.object({ id, code: z.string(), nameEn: z.string(), status }),
  ),
  updatedAt: z.string(),
});
export type CatalogConcern = z.infer<typeof catalogConcernSchema>;

const settingValue = z.union([z.boolean(), z.number(), z.string()]);
export const appSettingSchema = z.object({
  key: z.string(),
  group: z.string(),
  label: z.string(),
  help: z.string(),
  kind: z.enum(["boolean", "integer", "phone", "url", "text"]),
  unit: z.string().nullable(),
  min: z.number().nullable(),
  max: z.number().nullable(),
  public: z.boolean(),
  value: settingValue,
  defaultValue: settingValue,
  changedAt: z.string().nullable(),
});
export type AppSetting = z.infer<typeof appSettingSchema>;
export const appSettingsSchema = z.object({
  groups: z.array(z.object({ id: z.string(), label: z.string() })),
  settings: z.array(appSettingSchema),
});

export const listCatalogSpecialties = (session: OwnerSession) =>
  ownerApi().request({
    path: "/api/v1/platform/catalog/specialties",
    session,
    schema: z.array(catalogSpecialtySchema),
  });

export const listCatalogConcerns = (session: OwnerSession) =>
  ownerApi().request({
    path: "/api/v1/platform/catalog/concerns",
    session,
    schema: z.array(catalogConcernSchema),
  });

export const appSettings = (session: OwnerSession) =>
  ownerApi().request({
    path: "/api/v1/platform/app-settings",
    session,
    schema: appSettingsSchema,
  });

const period = z.object({
  weekday: z.number().int().min(0).max(6),
  startsMinute: z.number().int(),
  endsMinute: z.number().int(),
});
export type WeekPeriod = z.infer<typeof period>;

export const doctorHoursSchema = z.object({
  doctorId: id,
  displayName: z.string(),
  visitMinutes: z.number().int().nullable(),
  defaultVisitMinutes: z.number().int(),
  bookable: z.boolean(),
  acceptingNewPatients: z.boolean(),
  nextAvailableAt: z.string().nullable(),
  clinics: z.array(
    z.object({
      clinicId: id,
      clinicName: z.string(),
      timezone: z.string(),
      clinicActive: z.boolean(),
      openingHours: z.array(period),
      weekly: z.array(period),
      breaks: z.array(period),
      leave: z.array(z.object({ id, startsAt: z.string(), endsAt: z.string() })),
    }),
  ),
});
export type DoctorHours = z.infer<typeof doctorHoursSchema>;

export const clinicHoursSchema = z.object({
  clinicId: id,
  clinicName: z.string(),
  timezone: z.string(),
  periods: z.array(period),
  doctorPeriods: z.array(period.extend({ doctorId: id, doctorName: z.string() })),
});
export type ClinicHours = z.infer<typeof clinicHoursSchema>;

export const doctorHours = (session: OwnerSession, doctorId: string) =>
  ownerApi().request({
    path: `/api/v1/platform/doctors/${doctorId}/hours`,
    session,
    schema: doctorHoursSchema,
  });

export const clinicHours = (session: OwnerSession, clinicId: string) =>
  ownerApi().request({
    path: `/api/v1/platform/clinics/${clinicId}/hours`,
    session,
    schema: clinicHoursSchema,
  });
