import type { Prisma } from '@prisma/client';
import type {
  BillingAccess,
  BillingCommand,
  BillingCursor,
  BillingPeriod,
} from './billing';

export type BillingRecord = Readonly<Record<string, unknown>>;

export interface BillingRepository {
  plans(): Promise<readonly BillingRecord[]>;
  plan(id: string): Promise<BillingRecord | null>;
  organizationPlan(
    organizationId: string,
    at: Date,
  ): Promise<BillingRecord | null>;
  assignPlan(
    access: BillingAccess,
    organizationId: string,
    planId: string,
    effectiveFrom: Date,
    expectedVersion: number | null,
    requestId: string,
    command: BillingCommand,
  ): Promise<BillingRecord>;
  commissions(
    access: BillingAccess,
    organizationId: string,
    pageSize: number,
    cursor?: BillingCursor,
    doctorId?: string,
  ): Promise<{
    readonly items: readonly BillingRecord[];
    readonly next: BillingCursor | null;
  }>;
  statements(
    access: BillingAccess,
    organizationId: string,
    doctorId?: string,
  ): Promise<readonly BillingRecord[]>;
  statement(access: BillingAccess, id: string): Promise<BillingRecord | null>;
  /** This month's running statement for every doctor the caller may see. */
  currentStatements(
    access: BillingAccess,
    organizationId: string,
    period: BillingPeriod,
    doctorId?: string,
  ): Promise<readonly BillingRecord[]>;
  finalize(
    access: BillingAccess,
    id: string,
    version: number,
    requestId: string,
    command: BillingCommand,
  ): Promise<BillingRecord>;
  createPlan(
    access: BillingAccess,
    input: { displayName: string; commissionAmountIqd: number },
    requestId: string,
  ): Promise<BillingRecord>;
  setPlanStatus(
    access: BillingAccess,
    id: string,
    status: 'active' | 'inactive',
    requestId: string,
  ): Promise<BillingRecord>;
  setup(organizationId: string, now: Date): Promise<BillingRecord | null>;
  assignDoctorPlan(
    access: BillingAccess,
    organizationId: string,
    doctorId: string,
    planId: string | null,
    effectiveFrom: Date,
    requestId: string,
  ): Promise<BillingRecord | null>;
  setCycleStart(
    access: BillingAccess,
    organizationId: string,
    day: string,
    requestId: string,
  ): Promise<void>;
  creditCommission(
    access: BillingAccess,
    id: string,
    reason: string,
    requestId: string,
  ): Promise<BillingRecord>;
  materializeCompletion(
    tx: Prisma.TransactionClient,
    appointmentId: string,
    completedAt: Date,
    actorId: string,
    requestId: string,
  ): Promise<void>;
}
export const BILLING_REPOSITORY = Symbol('BILLING_REPOSITORY');
