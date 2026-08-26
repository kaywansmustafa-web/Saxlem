import "server-only";

import { z } from "zod";
import type { OwnerSession } from "@/domain/session";
import { ownerApi } from "@/infrastructure/auth";

const id = z.string().uuid();
const dateTime = z.string().datetime({ offset: true });
export const organizationSchema = z
  .object({
    id,
    name: z.string(),
    status: z.enum(["active", "inactive"]),
    createdAt: dateTime,
    updatedAt: dateTime,
  })
  .strict();
export const clinicSchema = z
  .object({
    id,
    organizationId: id,
    name: z.string(),
    code: z.string(),
    timezone: z.string(),
    status: z.enum(["active", "inactive"]),
    createdAt: dateTime,
    updatedAt: dateTime,
  })
  .strict();
export const organizationPageSchema = z
  .object({
    items: z.array(organizationSchema).max(100),
    nextCursor: z.string().nullable(),
  })
  .strict();
export const clinicPageSchema = z
  .object({
    items: z.array(clinicSchema).max(100),
    nextCursor: z.string().nullable(),
  })
  .strict();
const availabilitySchema = z
  .object({
    status: z.enum(["available", "unavailable"]),
    acceptingNewPatients: z.boolean(),
    nextAvailableAt: dateTime.nullable(),
    updatedAt: dateTime.nullable(),
  })
  .strict();
export const doctorSchema = z
  .object({
    id,
    displayName: z.string(),
    fullName: z.string(),
    specialty: z.string(),
    gender: z.enum(["female", "male", "unspecified"]),
    status: z.enum(["active", "inactive"]),
    yearsOfExperience: z.number().int().nonnegative(),
    languages: z.array(z.string()),
    profileImageUrl: z.string().url().nullable(),
    clinics: z.array(z.object({ id, name: z.string() }).strict()),
    availability: availabilitySchema,
  })
  .strict();
export const doctorPageSchema = z
  .object({
    items: z.array(doctorSchema).max(100),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  })
  .strict();
export const appointmentSchema = z
  .object({
    id,
    reference: z.string(),
    clinicId: id,
    clinicName: z.string(),
    doctorId: id,
    doctorName: z.string(),
    patientProfileId: id,
    patientName: z.string(),
    type: z.enum(["initial", "followUp"]),
    reason: z.string(),
    startsAt: dateTime,
    endsAt: dateTime,
    durationMinutes: z.number().int(),
    feeIqd: z.number().int(),
    status: z.enum([
      "scheduled",
      "confirmed",
      "cancelled",
      "completed",
      "noShow",
    ]),
    cancellationReason: z.string().nullable(),
    version: z.number().int(),
  })
  .strict();
export const appointmentPageSchema = z
  .object({
    items: z.array(appointmentSchema).max(50),
    nextCursor: z.string().nullable(),
  })
  .strict();
export const planSchema = z
  .object({
    id,
    code: z.string(),
    displayName: z.string(),
    status: z.enum(["active", "inactive"]),
    currency: z.literal("IQD"),
    commissionAmountIqd: z.number().int().positive(),
    ruleCode: z.string(),
    ruleVersion: z.number().int().positive(),
    version: z.number().int().positive(),
  })
  .strict();
export const commissionSchema = z.object({ id, organizationId:id, clinicId:id, appointmentId:id, appointmentReference:z.string(), planCode:z.string(), amountIqd:z.number().int().positive(), currency:z.literal("IQD"), ruleCode:z.string(), ruleVersion:z.number().int().positive(), planVersion:z.number().int().positive(), completedAt:dateTime, recognizedAt:dateTime, status:z.enum(["earned","reversed"]), originalCommissionId:id.nullable() }).strict();
export const commissionPageSchema = z.object({items:z.array(commissionSchema).max(100),nextCursor:z.string().nullable()}).strict();
export const statementSchema = z.object({id,organizationId:id,periodStart:dateTime,periodEnd:dateTime,timezone:z.literal("Asia/Baghdad"),status:z.enum(["draft","finalized"]),grossEarnedIqd:z.number().int().nonnegative(),reversalsIqd:z.number().int().nonnegative(),netCommissionIqd:z.number().int(),qualifyingCount:z.number().int().nonnegative(),reversalCount:z.number().int().nonnegative(),version:z.number().int().positive(),finalizedAt:dateTime.nullable()}).strict();

const query = (values: Record<string, string | number | undefined>): string => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values))
    if (value !== undefined) params.set(key, String(value));
  return params.toString();
};

export const listOrganizations = (session: OwnerSession) =>
  ownerApi().request({
    path: "/api/v1/administration/organizations?pageSize=100",
    session,
    schema: organizationPageSchema,
  });
export const listClinics = (session: OwnerSession, organizationId?: string) =>
  ownerApi().request({
    path: `/api/v1/administration/clinics?${query({ pageSize: 100, organizationId })}`,
    session,
    schema: clinicPageSchema,
  });
export const listDoctors = (session: OwnerSession, page = 1) =>
  ownerApi().request({
    path: `/api/v1/doctors?${query({ page, pageSize: 50, status: "active" })}`,
    session,
    schema: doctorPageSchema,
  });
export const listAppointments = (
  session: OwnerSession,
  from: string,
  to: string,
) =>
  ownerApi().request({
    path: `/api/v1/appointments?${query({ from, to, pageSize: 50 })}`,
    session,
    schema: appointmentPageSchema,
  });
export const listPlans = (session: OwnerSession) =>
  ownerApi().request({
    path: "/api/v1/billing/plans",
    session,
    schema: z.array(planSchema),
  });
export const listCommissions=(session:OwnerSession,organizationId:string)=>ownerApi().request({path:`/api/v1/billing/commissions?${query({organizationId,pageSize:100})}`,session,schema:commissionPageSchema});
export const listStatements=(session:OwnerSession,organizationId:string)=>ownerApi().request({path:`/api/v1/billing/statements?${query({organizationId})}`,session,schema:z.array(statementSchema)});

export const safeWindow = (): { from: string; to: string } => {
  const now = new Date();
  const from = new Date(now);
  from.setUTCHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setUTCDate(to.getUTCDate() + 1);
  return { from: from.toISOString(), to: to.toISOString() };
};
