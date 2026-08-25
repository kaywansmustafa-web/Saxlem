import type {
  BillingPlan,
  BillingStatement,
  BillingStatementDetail,
  CommissionPage,
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
  getCurrentStatement(organizationId: string): Promise<BillingStatement>;
  getStatement(statementId: string): Promise<BillingStatementDetail>;
  finalizeStatement(
    statementId: string,
    version: number,
    operationKey: string,
  ): Promise<BillingStatement>;
}
