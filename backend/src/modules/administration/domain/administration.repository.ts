import type { ClinicLocation } from '../../../common/clinics/clinic-location';
import type {
  AdministrationAccess,
  AdministrationCommand,
  AdministrationCursor,
  AdministrationPage,
  ClinicRecord,
  OrganizationRecord,
} from './administration';

export interface AdministrationRepository {
  createOrganization(
    access: AdministrationAccess,
    name: string,
    requestId: string,
    command: AdministrationCommand,
  ): Promise<OrganizationRecord>;
  listOrganizations(
    pageSize: number,
    cursor?: AdministrationCursor,
  ): Promise<AdministrationPage<OrganizationRecord>>;
  organization(id: string): Promise<OrganizationRecord | null>;
  createClinic(
    access: AdministrationAccess,
    input: {
      organizationId: string;
      name: string;
      code: string;
      timezone: string;
    },
    requestId: string,
    command: AdministrationCommand,
  ): Promise<ClinicRecord>;
  listClinics(
    pageSize: number,
    organizationId?: string,
    cursor?: AdministrationCursor,
  ): Promise<AdministrationPage<ClinicRecord>>;
  clinic(id: string): Promise<ClinicRecord | null>;
  updateClinicLocation(
    access: { actorId: string },
    id: string,
    location: ClinicLocation,
    requestId: string,
  ): Promise<ClinicRecord | null>;
}

export const ADMINISTRATION_REPOSITORY = Symbol('ADMINISTRATION_REPOSITORY');
