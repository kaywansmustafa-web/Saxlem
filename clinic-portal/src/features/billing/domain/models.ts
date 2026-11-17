import { z } from "zod";

const uuid = z.string().uuid();
const timestamp = z.string().datetime({ offset: true });
const positiveMoney = z.number().int().positive();
const nonnegativeMoney = z.number().int().nonnegative();
export const billingCursorSchema = z
  .string()
  .min(1)
  .max(2048)
  .regex(/^[\x21-\x7e]+$/u);

export const billingPlanSchema = z
  .object({
    id: uuid,
    code: z.string().min(1).max(100),
    displayName: z.string().min(1).max(160),
    status: z.enum(["active", "inactive"]),
    currency: z.literal("IQD"),
    // 0 IQD is a free (pilot) plan.
    commissionAmountIqd: nonnegativeMoney,
    ruleCode: z.string().min(1).max(160),
    ruleVersion: z.number().int().positive(),
    version: z.number().int().positive(),
  })
  .strict();

export const organizationPlanSchema = z
  .object({
    id: uuid,
    organizationId: uuid,
    effectiveFrom: timestamp,
    effectiveTo: timestamp.nullable(),
    version: z.number().int().positive(),
    plan: billingPlanSchema,
  })
  .strict();

export const commissionSchema = z
  .object({
    id: uuid,
    organizationId: uuid,
    clinicId: uuid,
    doctorId: uuid,
    doctorName: z.string().min(1).max(200),
    appointmentId: uuid,
    appointmentReference: z.string().min(1).max(100),
    planCode: z.string().min(1).max(100),
    amountIqd: positiveMoney,
    currency: z.literal("IQD"),
    ruleCode: z.string().min(1).max(160),
    ruleVersion: z.number().int().positive(),
    planVersion: z.number().int().positive(),
    completedAt: timestamp,
    recognizedAt: timestamp,
    status: z.enum(["earned", "reversed"]),
    originalCommissionId: uuid.nullable(),
    reason: z.string().nullable(),
  })
  .strict();

const unique = <T extends z.ZodTypeAny>(schema: T) =>
  z.array(schema).superRefine((items, ctx) => {
    const ids = new Set<string>();
    items.forEach((item, index) => {
      const id = (item as { id: string }).id;
      if (ids.has(id))
        ctx.addIssue({
          code: "custom",
          message: "Duplicate identifier.",
          path: [index, "id"],
        });
      ids.add(id);
    });
  });

export const commissionPageSchema = z
  .object({
    items: unique(commissionSchema),
    nextCursor: billingCursorSchema.nullable(),
  })
  .strict();

const statementBase = {
  id: uuid,
  organizationId: uuid,
  /** Each doctor is billed separately; null on old clinic-wide statements. */
  doctorId: uuid.nullable(),
  doctorName: z.string().min(1).max(200).nullable(),
  periodStart: timestamp,
  periodEnd: timestamp,
  timezone: z.literal("Asia/Baghdad"),
  status: z.enum(["draft", "finalized"]),
  grossEarnedIqd: nonnegativeMoney,
  reversalsIqd: nonnegativeMoney,
  netCommissionIqd: z.number().int(),
  qualifyingCount: z.number().int().nonnegative(),
  reversalCount: z.number().int().nonnegative(),
  version: z.number().int().positive(),
  finalizedAt: timestamp.nullable(),
};
export const billingStatementSchema = z.object(statementBase).strict();
export const statementLineSchema = z
  .object({
    id: uuid,
    clinicId: uuid,
    appointmentId: uuid,
    appointmentReference: z.string().min(1).max(100),
    recognizedAt: timestamp,
    status: z.enum(["earned", "reversed"]),
    amountIqd: positiveMoney,
    netAmountIqd: z.number().int(),
    currency: z.literal("IQD"),
  })
  .strict();
export const clinicBreakdownSchema = z
  .object({
    clinicId: uuid,
    grossEarnedIqd: nonnegativeMoney,
    reversalsIqd: nonnegativeMoney,
    netCommissionIqd: z.number().int(),
    qualifyingCount: z.number().int().nonnegative(),
    reversalCount: z.number().int().nonnegative(),
  })
  .strict();
export const billingStatementDetailSchema = z
  .object({
    ...statementBase,
    lines: unique(statementLineSchema),
    clinicBreakdowns: z
      .array(clinicBreakdownSchema)
      .superRefine((items, ctx) => {
        const ids = new Set<string>();
        items.forEach((item, index) => {
          if (ids.has(item.clinicId))
            ctx.addIssue({
              code: "custom",
              message: "Duplicate clinic.",
              path: [index, "clinicId"],
            });
          ids.add(item.clinicId);
        });
      }),
  })
  .strict();
export const billingStatementListSchema = unique(billingStatementSchema);
/** This month's running statement for each doctor. */
export const currentStatementsSchema = unique(billingStatementSchema);

export type BillingPlan = Readonly<z.infer<typeof billingPlanSchema>>;
export type OrganizationPlan = Readonly<z.infer<typeof organizationPlanSchema>>;
export type Commission = Readonly<z.infer<typeof commissionSchema>>;
export type CommissionPage = Readonly<z.infer<typeof commissionPageSchema>>;
export type BillingStatement = Readonly<z.infer<typeof billingStatementSchema>>;
export type BillingStatementDetail = Readonly<
  z.infer<typeof billingStatementDetailSchema>
>;

const money = z.number().int();
/** One doctor's 30-day statement (summary row). */
export const cycleStatementSchema = z
  .object({
    organizationId: uuid,
    organizationName: z.string(),
    doctorId: uuid,
    doctorName: z.string(),
    cycleNumber: z.number().int().positive(),
    statementNumber: z.string().min(1).max(40),
    periodStart: timestamp,
    periodEnd: timestamp,
    status: z.enum(["open", "due", "waiting", "settled"]),
    canSettle: z.boolean(),
    direction: z.enum(["saxlemPays", "doctorPays", "even"]),
    grossCollectedIqd: money,
    clawbackIqd: money,
    providerFeeIqd: money,
    commissionIqd: money,
    netPayableIqd: money,
    paymentCount: money,
    chargeCount: money.nullable(),
    settlement: z
      .object({
        method: z.enum(["fib", "cash"]),
        settledAt: timestamp,
        reference: z.string().nullable().optional(),
        counterpartyName: z.string().nullable().optional(),
        note: z.string().nullable().optional(),
        settledByName: z.string().optional(),
      })
      .strict()
      .nullable(),
  })
  .strict();
export type CycleStatement = z.infer<typeof cycleStatementSchema>;
export const cycleStatementListSchema = z
  .object({ items: z.array(cycleStatementSchema) })
  .strict();
const statementMoneySchema = z
  .object({
    id: uuid,
    at: timestamp,
    appointmentReference: z.string(),
    amountIqd: money,
  })
  .strict();
export const cycleStatementDocumentSchema = cycleStatementSchema
  .extend({
    issuedAt: timestamp,
    cycleStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u),
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
          id: uuid,
          recognizedAt: timestamp,
          appointmentReference: z.string(),
          appointmentStartsAt: timestamp,
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
  })
  .strict();
export type CycleStatementDocument = z.infer<
  typeof cycleStatementDocumentSchema
>;
