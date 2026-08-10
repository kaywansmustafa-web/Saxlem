import "server-only";
import { z } from "zod";
import type { AuthenticatedSession } from "@/features/authentication/domain/auth-models";
import type { BackendApiClient } from "@/infrastructure/api/api-client";
import {
  billingCursorSchema,
  billingPlanSchema,
  billingStatementDetailSchema,
  billingStatementListSchema,
  billingStatementSchema,
  commissionPageSchema,
  organizationPlanSchema,
} from "../domain/models";
import type { BillingRepository } from "../domain/repository";

export class BackendBillingRepository implements BillingRepository {
  constructor(
    private readonly api: BackendApiClient,
    private readonly session: AuthenticatedSession,
  ) {}
  private request<T>(
    path: `/api/v1/${string}`,
    schema: z.ZodType<T>,
    options: { method?: "POST"; body?: unknown; key?: string } = {},
  ) {
    return this.api
      .request({
        path,
        session: this.session,
        schema,
        method: options.method,
        body: options.body,
        idempotencyKey: options.key,
      })
      .then((x) => x.data);
  }
  listPlans() {
    return this.request("/api/v1/billing/plans", z.array(billingPlanSchema));
  }
  getPlan(id: string) {
    return this.request(
      `/api/v1/billing/plans/${encodeURIComponent(id)}`,
      billingPlanSchema,
    );
  }
  getOrganizationPlan(id: string) {
    return this.request(
      `/api/v1/billing/organizations/${encodeURIComponent(id)}/plan`,
      organizationPlanSchema,
    );
  }
  assignOrganizationPlan(
    input: {
      organizationId: string;
      planId: string;
      effectiveFrom: string;
      expectedVersion: number | null;
    },
    key: string,
  ) {
    const { organizationId, ...body } = input;
    return this.request(
      `/api/v1/billing/organizations/${encodeURIComponent(organizationId)}/plan-assignments`,
      organizationPlanSchema,
      { method: "POST", body, key },
    );
  }
  listCommissions(input: {
    organizationId: string;
    pageSize: number;
    cursor?: string;
  }) {
    const query = new URLSearchParams({
      organizationId: input.organizationId,
      pageSize: String(input.pageSize),
    });
    if (input.cursor)
      query.set("cursor", billingCursorSchema.parse(input.cursor));
    return this.request(
      `/api/v1/billing/commissions?${query}` as `/api/v1/${string}`,
      commissionPageSchema,
    );
  }
  listStatements(organizationId: string) {
    return this.request(
      `/api/v1/billing/statements?organizationId=${encodeURIComponent(organizationId)}`,
      billingStatementListSchema,
    );
  }
  getCurrentStatement(organizationId: string) {
    return this.request(
      `/api/v1/billing/statements/current?organizationId=${encodeURIComponent(organizationId)}`,
      billingStatementSchema,
    );
  }
  getStatement(id: string) {
    return this.request(
      `/api/v1/billing/statements/${encodeURIComponent(id)}`,
      billingStatementDetailSchema,
    );
  }
  finalizeStatement(id: string, version: number, key: string) {
    return this.request(
      `/api/v1/billing/statements/${encodeURIComponent(id)}/finalize`,
      billingStatementSchema,
      { method: "POST", body: { version }, key },
    );
  }
}
