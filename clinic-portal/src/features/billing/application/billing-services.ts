import type { BillingRepository } from "../domain/repository";

export class BillingReadServices {
  constructor(
    protected readonly repository: BillingRepository,
    readonly organizationId: string,
  ) {}
  listCommissions(pageSize: number, cursor?: string) {
    return this.repository.listCommissions({
      organizationId: this.organizationId,
      pageSize,
      ...(cursor ? { cursor } : {}),
    });
  }
  listStatements() {
    return this.repository.listStatements(this.organizationId);
  }
  currentStatement() {
    return this.repository.getCurrentStatement(this.organizationId);
  }
  statement(id: string) {
    return this.repository.getStatement(id);
  }
}
export class PlatformBillingServices extends BillingReadServices {
  plans() {
    return this.repository.listPlans();
  }
  plan(id: string) {
    return this.repository.getPlan(id);
  }
  organizationPlan(id: string) {
    return this.repository.getOrganizationPlan(id);
  }
  assign(
    input: Parameters<BillingRepository["assignOrganizationPlan"]>[0],
    key: string,
  ) {
    return this.repository.assignOrganizationPlan(input, key);
  }
  finalize(id: string, version: number, key: string) {
    return this.repository.finalizeStatement(id, version, key);
  }
}
