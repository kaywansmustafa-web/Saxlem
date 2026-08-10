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
  ): Promise<{
    readonly items: readonly BillingRecord[];
    readonly next: BillingCursor | null;
  }>;
  statements(
    access: BillingAccess,
    organizationId: string,
  ): Promise<readonly BillingRecord[]>;
  statement(access: BillingAccess, id: string): Promise<BillingRecord | null>;
  currentStatement(
    access: BillingAccess,
    organizationId: string,
    period: BillingPeriod,
  ): Promise<BillingRecord>;
  finalize(
    access: BillingAccess,
    id: string,
    version: number,
    requestId: string,
    command: BillingCommand,
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
