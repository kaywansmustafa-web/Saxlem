import type {
  BillingPlan,
  BillingStatement,
  BillingStatementDetail,
  CommissionPage,
  Collection,
  CycleStatement,
  CycleStatementDocument,
  OrganizationPlan,
} from "./models";

export interface BillingRepository {
  listPlans(): Promise<readonly BillingPlan[]>;
  getPlan(planId: string): Promise<BillingPlan>;
  getOrganizationPlan(organizationId: string): Promise<OrganizationPlan>;
  assignOrganizationPlan(
    input: {
      organizationId: string;
      planId: string;
      effectiveFrom: string;
      expectedVersion: number | null;
    },
    operationKey: string,
  ): Promise<OrganizationPlan>;
  listCommissions(input: {
    organizationId: string;
    pageSize: number;
    cursor?: string;
  }): Promise<CommissionPage>;
  listStatements(organizationId: string): Promise<readonly BillingStatement[]>;
  /** One running statement per doctor (each doctor is billed separately). */
  getCurrentStatements(
    organizationId: string,
  ): Promise<readonly BillingStatement[]>;
  getStatement(statementId: string): Promise<BillingStatementDetail>;
  /** Each doctor's 30-day statements the session may see. */
  listCycleStatements(): Promise<readonly CycleStatement[]>;
  /** Doctors who owe Saxlem, in the session's scope. */
  listCollections(): Promise<readonly Collection[]>;
  getCycleStatement(
    organizationId: string,
    doctorId: string,
    cycleNumber: number,
  ): Promise<CycleStatementDocument>;
  finalizeStatement(
    statementId: string,
    version: number,
    operationKey: string,
  ): Promise<BillingStatement>;
}
