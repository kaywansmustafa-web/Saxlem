import { describe, expect, it } from "vitest";
import {
  billingPlanSchema,
  billingStatementDetailSchema,
  commissionPageSchema,
} from "@/features/billing/domain/models";

const id = "11111111-1111-4111-8111-111111111111",
  at = "2026-08-10T00:00:00.000Z";
describe("billing contracts", () => {
  it("accepts integer-IQD plans and rejects editable or foreign financial fields", () => {
    const plan = {
      id,
      code: "STANDARD_1250",
      displayName: "Standard",
      status: "active",
      currency: "IQD",
      commissionAmountIqd: 1250,
      ruleCode: "RULE",
      ruleVersion: 1,
      version: 1,
    };
    expect(billingPlanSchema.parse(plan).commissionAmountIqd).toBe(1250);
    expect(
      billingPlanSchema.safeParse({ ...plan, currency: "USD" }).success,
    ).toBe(false);
    expect(
      billingPlanSchema.safeParse({ ...plan, commissionAmountIqd: 1.5 })
        .success,
    ).toBe(false);
    expect(
      billingPlanSchema.safeParse({ ...plan, patientName: "private" }).success,
    ).toBe(false);
  });
  it("rejects duplicate ledger IDs, unsafe cursors and malformed statement snapshots", () => {
    const entry = {
      id,
      organizationId: id,
      clinicId: id,
      appointmentId: id,
      appointmentReference: "APT-1",
      planCode: "STANDARD_1250",
      amountIqd: 1250,
      currency: "IQD",
      ruleCode: "RULE",
      ruleVersion: 1,
      planVersion: 1,
      completedAt: at,
      recognizedAt: at,
      status: "earned",
      originalCommissionId: null,
    };
    expect(
      commissionPageSchema.safeParse({
        items: [entry, entry],
        nextCursor: null,
      }).success,
    ).toBe(false);
    expect(
      commissionPageSchema.safeParse({
        items: [entry],
        nextCursor: "bad cursor",
      }).success,
    ).toBe(false);
    const statement = {
      id,
      organizationId: id,
      periodStart: at,
      periodEnd: "2026-09-01T00:00:00.000Z",
      timezone: "Asia/Baghdad",
      status: "finalized",
      grossEarnedIqd: 1250,
      reversalsIqd: 0,
      netCommissionIqd: 1250,
      qualifyingCount: 1,
      reversalCount: 0,
      version: 2,
      finalizedAt: at,
      lines: [],
      clinicBreakdowns: [],
    };
    expect(billingStatementDetailSchema.safeParse(statement).success).toBe(
      true,
    );
    expect(
      billingStatementDetailSchema.safeParse({
        ...statement,
        grossEarnedIqd: -1,
      }).success,
    ).toBe(false);
  });
});
