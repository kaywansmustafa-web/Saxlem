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
    fees: z
      .object({
        firstVisitIqd: z.number().int().nonnegative(),
        followUpIqd: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict();
export const doctorDetailSchema = doctorSchema
  .extend({
    firstName: z.string(),
    lastName: z.string(),
    licenseNumber: z.string(),
    biography: z.string(),
    specialties: z.array(
      z
        .object({
          id,
          code: z.string(),
          displayName: z.string(),
          isPrimary: z.boolean(),
        })
        .strict(),
    ),
    version: z.number().int().positive(),
    customFees: z
      .object({
        firstVisitIqd: z.number().int().nonnegative().nullable(),
        followUpIqd: z.number().int().nonnegative().nullable(),
      })
      .strict(),
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
    origin: z.enum(["patientBooked", "clinicCreated", "walkIn"]).optional(),
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
    commissionAmountIqd: z.number().int().nonnegative(),
    ruleCode: z.string(),
    ruleVersion: z.number().int().positive(),
    version: z.number().int().positive(),
  })
  .strict();
export const commissionSchema = z
  .object({
    id,
    organizationId: id,
    clinicId: id,
    doctorId: id,
    doctorName: z.string(),
    appointmentId: id,
    appointmentReference: z.string(),
    planCode: z.string(),
    amountIqd: z.number().int().positive(),
    currency: z.literal("IQD"),
    ruleCode: z.string(),
    ruleVersion: z.number().int().positive(),
    planVersion: z.number().int().positive(),
    completedAt: dateTime,
    recognizedAt: dateTime,
    status: z.enum(["earned", "reversed"]),
    originalCommissionId: id.nullable(),
    reason: z.string().nullable(),
  })
  .strict();
export const commissionPageSchema = z
  .object({
    items: z.array(commissionSchema).max(100),
    nextCursor: z.string().nullable(),
  })
  .strict();
export const statementSchema = z
  .object({
    id,
    organizationId: id,
    /** Each doctor is billed separately; null on old clinic-wide statements. */
    doctorId: id.nullable(),
    doctorName: z.string().nullable(),
    periodStart: dateTime,
    periodEnd: dateTime,
    timezone: z.literal("Asia/Baghdad"),
    status: z.enum(["draft", "finalized"]),
    grossEarnedIqd: z.number().int().nonnegative(),
    reversalsIqd: z.number().int().nonnegative(),
    netCommissionIqd: z.number().int(),
    qualifyingCount: z.number().int().nonnegative(),
    reversalCount: z.number().int().nonnegative(),
    version: z.number().int().positive(),
    finalizedAt: dateTime.nullable(),
  })
  .strict();
export const staffSchema = z
  .object({
    userId: id,
    staffAccountId: id,
    email: z.string().email(),
    status: z.enum(["active", "inactive"]),
    roles: z.array(
      z
        .object({
          id,
          role: z.string(),
          organizationId: id.nullable(),
          clinicId: id.nullable(),
        })
        .strict(),
    ),
    memberships: z.array(
      z
        .object({
          id,
          organizationId: id,
          clinicId: id,
          role: z.string(),
          status: z.enum(["active", "inactive"]),
          organizationName: z.string(),
          clinicName: z.string(),
        })
        .strict(),
    ),
    doctorId: id.nullable(),
    doctorName: z.string().nullable(),
    receptionDoctors: z
      .array(
        z
          .object({
            organizationId: id,
            clinicId: id,
            doctorId: id,
            doctorName: z.string(),
          })
          .strict(),
      )
      .optional(),
    createdAt: dateTime,
    updatedAt: dateTime,
  })
  .strict();
export const createStaffResponseSchema = staffSchema
  .extend({ activationCredential: z.string(), activationExpiresAt: dateTime })
  .strict();
export const staffPageSchema = z
  .object({
    items: z.array(staffSchema).max(100),
    nextCursor: z.string().nullable(),
  })
  .strict();
export const patientSchema = z
  .object({
    accountId: id,
    userId: id,
    maskedPhone: z.string(),
    status: z.enum(["active", "inactive"]),
    displayName: z.string(),
    profileCount: z.number().int().nonnegative(),
    appointmentCount: z.number().int().nonnegative(),
    mostRecentAppointmentAt: dateTime.nullable(),
    createdAt: dateTime,
  })
  .strict();
export const patientPageSchema = z
  .object({
    items: z.array(patientSchema).max(100),
    nextCursor: z.string().nullable(),
  })
  .strict();
export const patientDetailSchema = patientSchema
  .extend({
    profiles: z.array(
      z
        .object({
          id,
          firstName: z.string(),
          lastName: z.string(),
          status: z.enum(["active", "inactive"]),
          relationship: z.string(),
        })
        .strict(),
    ),
    appointments: z
      .array(
        z
          .object({
            id,
            publicReference: z.string(),
            patientProfileId: id,
            clinicId: id,
            startsAt: dateTime,
            status: z.string(),
          })
          .strict(),
      )
      .max(50),
  })
  .strict();
export const liveOperationSchema = z
  .object({
    queueSessionId: id,
    organizationId: id,
    organizationName: z.string(),
    clinicId: id,
    clinicName: z.string(),
    doctorId: id,
    doctorName: z.string(),
    operationalDate: z.string(),
    effectiveTimezone: z.string(),
    status: z.enum(["notStarted", "open", "paused", "closed"]),
    waitingCount: z.number().int(),
    calledCount: z.number().int(),
    inConsultationCount: z.number().int(),
    currentPatientInitials: z.string().nullable(),
    estimatedDelayMinutes: z.number().int().nullable(),
    health: z.enum(["healthy", "busy", "delayed", "paused", "closed"]),
    updatedAt: dateTime,
  })
  .strict();
export const analyticsSchema = z
  .object({
    totals: z.record(z.string(), z.number().int()),
    appointmentTrend: z.array(z.record(z.string(), z.unknown())),
    commissionTrend: z.array(z.record(z.string(), z.unknown())),
    patientGrowth: z.array(z.record(z.string(), z.unknown())),
    clinicGrowth: z.array(z.record(z.string(), z.unknown())),
    doctorGrowth: z.array(z.record(z.string(), z.unknown())),
    cancellationTrend: z.array(z.record(z.string(), z.unknown())),
    noShowTrend: z.array(z.record(z.string(), z.unknown())),
    busiestClinics: z.array(z.record(z.string(), z.unknown())),
    busiestDoctors: z.array(z.record(z.string(), z.unknown())),
  })
  .strict();
export const auditSchema = z
  .object({
    id,
    organizationId: id.nullable(),
    clinicId: id.nullable(),
    actorUserId: id.nullable(),
    action: z.string(),
    targetType: z.string(),
    targetId: id.nullable(),
    outcome: z.enum(["succeeded", "denied", "failed"]),
    requestId: z.string().nullable(),
    occurredAt: dateTime,
  })
  .strict();
export const auditPageSchema = z
  .object({
    items: z.array(auditSchema).max(100),
    nextCursor: z.string().nullable(),
  })
  .strict();
export const documentSchema = z
  .object({
    id,
    entityType: z.string(),
    entityId: id,
    organizationId: id.nullable(),
    clinicId: id.nullable(),
    category: z.string(),
    filename: z.string(),
    contentType: z.string(),
    sizeBytes: z.number().int(),
    status: z.string(),
    uploadedAt: dateTime.nullable(),
    expiresAt: dateTime.nullable(),
    createdAt: dateTime,
  })
  .strict();
export const searchResultSchema = z
  .object({
    category: z.string(),
    id,
    label: z.string(),
    description: z.string(),
    href: z.string(),
  })
  .strict();
export const settingsSchema = z
  .object({
    identity: z
      .object({
        id,
        status: z.string(),
        roles: z.array(z.string()),
        createdAt: dateTime,
        updatedAt: dateTime,
      })
      .nullable(),
    apiVersion: z.string(),
    environment: z.string(),
  })
  .strict();
export const platformSpecialtySchema = z
  .object({ id, code: z.string(), displayName: z.string() })
  .strict();

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
/** Every active doctor (up to 500), for choosing a receptionist's doctor. */
export async function listAllDoctors(session: OwnerSession) {
  const first = await listDoctors(session, 1);
  const pages = Math.min(first.totalPages, 10);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, pages - 1) }, (_, index) =>
      listDoctors(session, index + 2),
    ),
  );
  return [first, ...rest].flatMap((page) => page.items);
}
export const doctorDetail = (session: OwnerSession, doctorId: string) =>
  ownerApi().request({
    path: `/api/v1/platform/doctors/${doctorId}`,
    session,
    schema: doctorDetailSchema,
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
export const listCommissions = (
  session: OwnerSession,
  organizationId: string,
) =>
  ownerApi().request({
    path: `/api/v1/billing/commissions?${query({ organizationId, pageSize: 100 })}`,
    session,
    schema: commissionPageSchema,
  });
export const listStatements = (session: OwnerSession, organizationId: string) =>
  ownerApi().request({
    path: `/api/v1/billing/statements?${query({ organizationId })}`,
    session,
    schema: z.array(statementSchema),
  });
export const listStaff = (session: OwnerSession, search?: string) =>
  ownerApi().request({
    path: `/api/v1/platform/staff?${query({ pageSize: 50, search })}`,
    session,
    schema: staffPageSchema,
  });
export const staffDetail = (session: OwnerSession, staffAccountId: string) =>
  ownerApi().request({
    path: `/api/v1/platform/staff/${staffAccountId}`,
    session,
    schema: staffSchema,
  });
export const listPatients = (session: OwnerSession, search?: string) =>
  ownerApi().request({
    path: `/api/v1/platform/patients?${query({ pageSize: 50, search })}`,
    session,
    schema: patientPageSchema,
  });
export const patientDetail = (session: OwnerSession, accountId: string) =>
  ownerApi().request({
    path: `/api/v1/platform/patients/${accountId}`,
    session,
    schema: patientDetailSchema,
  });
export const listLiveOperations = (session: OwnerSession) =>
  ownerApi().request({
    path: "/api/v1/platform/live-operations?pageSize=100",
    session,
    schema: z.array(liveOperationSchema),
  });
export const executiveAnalytics = (session: OwnerSession) =>
  ownerApi().request({
    path: "/api/v1/platform/analytics/executive",
    session,
    schema: analyticsSchema,
  });
export const listAuditEvents = (session: OwnerSession) =>
  ownerApi().request({
    path: "/api/v1/platform/audit-events?pageSize=50",
    session,
    schema: auditPageSchema,
  });
export const listDocuments = (session: OwnerSession) =>
  ownerApi().request({
    path: "/api/v1/platform/documents?pageSize=50",
    session,
    schema: z.array(documentSchema),
  });
export const globalSearch = (session: OwnerSession, q: string) =>
  ownerApi().request({
    path: `/api/v1/platform/search?${query({ q, limit: 5 })}`,
    session,
    schema: z.array(searchResultSchema).max(60),
  });
export const ownerSettings = (session: OwnerSession) =>
  ownerApi().request({
    path: "/api/v1/platform/settings",
    session,
    schema: settingsSchema,
  });
export const listPlatformSpecialties = (session: OwnerSession) =>
  ownerApi().request({
    path: "/api/v1/platform/specialties",
    session,
    schema: z.array(platformSpecialtySchema),
  });

export const safeWindow = (): { from: string; to: string } => {
  const now = new Date();
  const from = new Date(now);
  from.setUTCHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setUTCDate(to.getUTCDate() + 1);
  return { from: from.toISOString(), to: to.toISOString() };
};

export const paymentAccountSchema = z
  .object({
    organizationId: z.string().uuid(),
    connected: z.boolean(),
    provider: z.enum(["fib", "simulated"]).nullable(),
    environment: z.string().nullable(),
    clientIdHint: z.string().nullable(),
    onlineEnabled: z.boolean(),
    platformOnlineEnabled: z.boolean(),
    updatedAt: z.string().datetime({ offset: true }).nullable(),
  })
  .strict();
export type PaymentAccount = z.infer<typeof paymentAccountSchema>;

export const paymentAccount = (session: OwnerSession, organizationId: string) =>
  ownerApi().request({
    path: `/api/v1/platform/organizations/${encodeURIComponent(organizationId)}/payment-account`,
    session,
    schema: paymentAccountSchema,
  });

export const paymentSettingsSchema = z
  .object({
    collectionMode: z.enum(["platform", "clinic"]),
    onlineEnabled: z.boolean(),
    platformAccount: z
      .object({
        provider: z.enum(["fib", "simulated"]),
        environment: z.string(),
        clientIdHint: z.string(),
      })
      .strict()
      .nullable(),
    providerFeeBps: z.number().int(),
    feePassedToClinic: z.boolean(),
  })
  .strict();
export type PaymentSettings = z.infer<typeof paymentSettingsSchema>;

const ledgerEntrySchema = z
  .object({
    id: z.string().uuid(),
    appointmentId: z.string().uuid(),
    appointmentReference: z.string(),
    organizationId: z.string().uuid(),
    organizationName: z.string(),
    clinicId: z.string().uuid(),
    clinicName: z.string(),
    doctorId: z.string().uuid(),
    doctorName: z.string(),
    patientName: z.string(),
    bookedAt: z.string(),
    appointmentStartsAt: z.string(),
    method: z.enum(["counter", "online"]),
    amountIqd: z.number().int(),
    status: z.string(),
    collectedBy: z.enum(["platform", "organization"]).nullable(),
    provider: z.enum(["fib", "simulated"]).nullable(),
    payerName: z.string().nullable(),
    paidAt: z.string().nullable(),
    refundedAt: z.string().nullable(),
    payoutId: z.string().uuid().nullable(),
  })
  .strict();
export const ledgerSchema = z
  .object({
    items: z.array(ledgerEntrySchema),
    nextCursor: z.string().uuid().nullable(),
  })
  .strict();
export type LedgerEntry = z.infer<typeof ledgerEntrySchema>;

export const payoutProfileSchema = z
  .object({
    organizationId: z.string().uuid(),
    onlinePaymentsEnabled: z.boolean(),
    payoutAccountName: z.string().nullable(),
    payoutAccountNumberHint: z.string().nullable(),
    version: z.number().int(),
  })
  .strict();
export type PayoutProfile = z.infer<typeof payoutProfileSchema>;

export const doctorPayoutProfileSchema = z
  .object({
    organizationId: z.string().uuid(),
    doctorId: z.string().uuid(),
    payoutAccountName: z.string().nullable(),
    payoutAccountNumberHint: z.string().nullable(),
    version: z.number().int(),
  })
  .strict();
export type DoctorPayoutProfile = z.infer<typeof doctorPayoutProfileSchema>;

export const paymentSettings = (session: OwnerSession) =>
  ownerApi().request({
    path: "/api/v1/platform/payments/settings",
    session,
    schema: paymentSettingsSchema,
  });

export const paymentLedger = (
  session: OwnerSession,
  month: string,
  options: { organizationId?: string; method?: string; cursor?: string } = {},
) => {
  const query = new URLSearchParams({ month, pageSize: "100" });
  if (options.organizationId)
    query.set("organizationId", options.organizationId);
  if (options.method) query.set("method", options.method);
  if (options.cursor) query.set("cursor", options.cursor);
  return ownerApi().request({
    path: `/api/v1/platform/payments/ledger?${query}`,
    session,
    schema: ledgerSchema,
  });
};

export const doctorPayoutProfile = (
  session: OwnerSession,
  organizationId: string,
  doctorId: string,
) =>
  ownerApi().request({
    path: `/api/v1/platform/organizations/${encodeURIComponent(organizationId)}/doctors/${encodeURIComponent(doctorId)}/payout-profile`,
    session,
    schema: doctorPayoutProfileSchema,
  });

export const payoutProfile = (session: OwnerSession, organizationId: string) =>
  ownerApi().request({
    path: `/api/v1/platform/organizations/${encodeURIComponent(organizationId)}/payout-profile`,
    session,
    schema: payoutProfileSchema,
  });

const assignmentSchema = z
  .object({
    id,
    organizationId: id,
    effectiveFrom: dateTime,
    effectiveTo: dateTime.nullable(),
    version: z.number().int().positive(),
    plan: planSchema,
  })
  .strict();
const doctorAssignmentSchema = z
  .object({
    id,
    doctorId: id,
    effectiveFrom: dateTime,
    effectiveTo: dateTime.nullable(),
    plan: planSchema,
  })
  .strict();
export const billingSetupSchema = z
  .object({
    organizationId: id,
    organizationName: z.string(),
    cycleStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    currentCycle: z
      .object({
        number: z.number().int().positive(),
        start: dateTime,
        end: dateTime,
      })
      .strict(),
    plan: assignmentSchema.nullable(),
    upcomingPlan: assignmentSchema.nullable(),
    doctors: z.array(
      z
        .object({
          doctorId: id,
          doctorName: z.string(),
          ownPlan: doctorAssignmentSchema.nullable(),
          upcomingOwnPlan: doctorAssignmentSchema.nullable(),
          effectivePlan: planSchema.nullable(),
        })
        .strict(),
    ),
  })
  .strict();
export type BillingSetup = z.infer<typeof billingSetupSchema>;
export const billingSetup = (session: OwnerSession, organizationId: string) =>
  ownerApi().request({
    path: `/api/v1/billing/organizations/${organizationId}/setup`,
    session,
    schema: billingSetupSchema,
  });

const money = z.number().int();
export const statementSummarySchema = z
  .object({
    organizationId: id,
    organizationName: z.string(),
    doctorId: id,
    doctorName: z.string(),
    cycleNumber: z.number().int().positive(),
    statementNumber: z.string(),
    periodStart: dateTime,
    periodEnd: dateTime,
    status: z.enum(["open", "due", "waiting", "settled"]),
    canSettle: z.boolean(),
    direction: z.enum(["saxlemPays", "doctorPays", "even"]),
    grossCollectedIqd: money,
    clawbackIqd: money,
    providerFeeIqd: money,
    commissionIqd: money,
    carriedInIqd: money,
    netPayableIqd: money,
    paymentCount: money,
    chargeCount: money.nullable(),
    dueAt: dateTime.nullable(),
    settlement: z
      .object({
        method: z.enum(["fib", "cash", "carried"]),
        settledAt: dateTime,
        carriedIntoStatement: z.string().nullable().optional(),
        reference: z.string().nullable().optional(),
        counterpartyName: z.string().nullable().optional(),
        note: z.string().nullable().optional(),
        settledByName: z.string().nullable().optional(),
      })
      .strict()
      .nullable(),
  })
  .strict();
export type StatementSummary = z.infer<typeof statementSummarySchema>;
const statementMoneySchema = z
  .object({
    id,
    at: dateTime,
    appointmentReference: z.string(),
    amountIqd: money,
  })
  .strict();
export const statementDocumentSchema = statementSummarySchema
  .extend({
    issuedAt: dateTime,
    cycleStart: z.string(),
    clinicNames: z.array(z.string()),
    providerFeeBps: money,
    payoutAccount: z
      .object({ name: z.string().nullable(), numberHint: z.string() })
      .strict()
      .nullable(),
    visits: z
      .object({
        total: money,
        completed: money,
        noShow: money,
        cancelled: money,
        upcoming: money,
        app: money,
        phone: money,
        walkIn: money,
      })
      .strict(),
    revenue: z
      .object({
        totalIqd: money,
        counterIqd: money,
        counterCount: money,
        onlineIqd: money,
        onlineCount: money,
      })
      .strict(),
    charges: z.array(
      z
        .object({
          id,
          recognizedAt: dateTime,
          appointmentReference: z.string(),
          appointmentStartsAt: dateTime,
          clinicName: z.string(),
          planName: z.string(),
          amountIqd: money,
          kind: z.enum(["charge", "credit"]),
          reason: z.string().nullable(),
        })
        .strict(),
    ),
    onlinePayments: z.array(statementMoneySchema),
    refunds: z.array(statementMoneySchema),
    carriedFrom: z.array(
      z
        .object({
          statementNumber: z.string(),
          cycleNumber: z.number().int().positive(),
          amountIqd: money,
        })
        .strict(),
    ),
  })
  .strict();
export type StatementDocument = z.infer<typeof statementDocumentSchema>;
export const listBillingStatements = (
  session: OwnerSession,
  organizationId?: string,
) =>
  ownerApi().request({
    path: `/api/v1/statements${organizationId ? `?organizationId=${organizationId}` : ""}`,
    session,
    schema: z.object({ items: z.array(statementSummarySchema) }).strict(),
  });
export const statementDocument = (
  session: OwnerSession,
  organizationId: string,
  doctorId: string,
  cycleNumber: number,
) =>
  ownerApi().request({
    path: `/api/v1/statements/${organizationId}/${doctorId}/${cycleNumber}`,
    session,
    schema: statementDocumentSchema,
  });

export const collectionSchema = z
  .object({
    organizationId: id,
    organizationName: z.string(),
    doctorId: id,
    doctorName: z.string(),
    stage: z.enum(["clear", "due", "overdue", "warning", "hidden"]),
    owedIqd: money,
    cycleNumber: z.number().int().positive().nullable(),
    statementNumber: z.string().nullable(),
    dueAt: dateTime.nullable(),
    warnOn: dateTime.nullable(),
    hideOn: dateTime.nullable(),
    hiddenAt: dateTime.nullable(),
    graceUntil: dateTime.nullable(),
  })
  .strict();
export type Collection = z.infer<typeof collectionSchema>;
export const listCollections = (
  session: OwnerSession,
  organizationId?: string,
) =>
  ownerApi().request({
    path: `/api/v1/statements/collections${organizationId ? `?organizationId=${organizationId}` : ""}`,
    session,
    schema: z.object({ items: z.array(collectionSchema) }).strict(),
  });
