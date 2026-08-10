import type { AdministrationPage, Clinic, Organization } from "./models";

export interface AdministrationRepository {
  listOrganizations(input: {
    pageSize: number;
    cursor?: string;
  }): Promise<AdministrationPage<Organization>>;
  getOrganization(id: string): Promise<Organization>;
  createOrganization(
    input: { name: string },
    operationId: string,
  ): Promise<Organization>;
  listClinics(input: {
    pageSize: number;
    cursor?: string;
    organizationId?: string;
  }): Promise<AdministrationPage<Clinic>>;
  getClinic(id: string): Promise<Clinic>;
  createClinic(
    input: {
      organizationId: string;
      name: string;
      code: string;
      timezone: string;
    },
    operationId: string,
  ): Promise<Clinic>;
}
