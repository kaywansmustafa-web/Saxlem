import type { AdministrationRepository } from "../domain/repository";

export class AdministrationServices {
  constructor(private readonly repository: AdministrationRepository) {}
  listOrganizations(
    input: Parameters<AdministrationRepository["listOrganizations"]>[0],
  ) {
    return this.repository.listOrganizations(input);
  }
  getOrganization(id: string) {
    return this.repository.getOrganization(id);
  }
  createOrganization(
    input: Parameters<AdministrationRepository["createOrganization"]>[0],
    operationId: string,
  ) {
    return this.repository.createOrganization(input, operationId);
  }
  listClinics(input: Parameters<AdministrationRepository["listClinics"]>[0]) {
    return this.repository.listClinics(input);
  }
  getClinic(id: string) {
    return this.repository.getClinic(id);
  }
  createClinic(
    input: Parameters<AdministrationRepository["createClinic"]>[0],
    operationId: string,
  ) {
    return this.repository.createClinic(input, operationId);
  }
}
