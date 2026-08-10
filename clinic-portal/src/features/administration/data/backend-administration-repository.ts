import "server-only";

import type { AuthenticatedSession } from "@/features/authentication/domain/auth-models";
import type { BackendApiClient } from "@/infrastructure/api/api-client";
import {
  administrationCursorSchema,
  clinicPageSchema,
  clinicSchema,
  organizationPageSchema,
  organizationSchema,
  type AdministrationPage,
  type Clinic,
  type Organization,
} from "../domain/models";
import type { AdministrationRepository } from "../domain/repository";

export class BackendAdministrationRepository implements AdministrationRepository {
  constructor(
    private readonly api: BackendApiClient,
    private readonly session: AuthenticatedSession,
  ) {}

  async listOrganizations(input: {
    pageSize: number;
    cursor?: string;
  }): Promise<AdministrationPage<Organization>> {
    const query = this.query(input);
    return this.page(
      (
        await this.api.request({
          path: `/api/v1/administration/organizations?${query}` as `/api/v1/${string}`,
          session: this.session,
          schema: organizationPageSchema,
        })
      ).data,
    );
  }
  async getOrganization(id: string) {
    return (
      await this.api.request({
        path: `/api/v1/administration/organizations/${encodeURIComponent(id)}`,
        session: this.session,
        schema: organizationSchema,
      })
    ).data;
  }
  async createOrganization(input: { name: string }, operationId: string) {
    return (
      await this.api.request({
        path: "/api/v1/administration/organizations",
        method: "POST",
        session: this.session,
        body: input,
        idempotencyKey: operationId,
        schema: organizationSchema,
      })
    ).data;
  }
  async listClinics(input: {
    pageSize: number;
    cursor?: string;
    organizationId?: string;
  }): Promise<AdministrationPage<Clinic>> {
    const query = this.query(input);
    if (input.organizationId) query.set("organizationId", input.organizationId);
    return this.page(
      (
        await this.api.request({
          path: `/api/v1/administration/clinics?${query}` as `/api/v1/${string}`,
          session: this.session,
          schema: clinicPageSchema,
        })
      ).data,
    );
  }
  async getClinic(id: string) {
    return (
      await this.api.request({
        path: `/api/v1/administration/clinics/${encodeURIComponent(id)}`,
        session: this.session,
        schema: clinicSchema,
      })
    ).data;
  }
  async createClinic(
    input: {
      organizationId: string;
      name: string;
      code: string;
      timezone: string;
    },
    operationId: string,
  ) {
    return (
      await this.api.request({
        path: "/api/v1/administration/clinics",
        method: "POST",
        session: this.session,
        body: input,
        idempotencyKey: operationId,
        schema: clinicSchema,
      })
    ).data;
  }
  private query(input: { pageSize: number; cursor?: string }) {
    const query = new URLSearchParams({ pageSize: String(input.pageSize) });
    if (input.cursor)
      query.set("cursor", administrationCursorSchema.parse(input.cursor));
    return query;
  }
  private page<T>(value: {
    items: T[];
    nextCursor: string | null;
  }): AdministrationPage<T> {
    return Object.freeze({
      items: Object.freeze(value.items),
      nextCursor: value.nextCursor,
    });
  }
}
