import type { RecordStatus } from '@prisma/client';

export interface AdministrationAccess {
  readonly actorId: string;
}

export interface OrganizationRecord {
  readonly id: string;
  readonly name: string;
  readonly status: RecordStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ClinicRecord {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly code: string;
  readonly timezone: string;
  readonly status: RecordStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AdministrationCommand {
  readonly key: string;
  readonly scope:
    'administration.organization.create' | 'administration.clinic.create';
  readonly hash: string;
}

export interface AdministrationCursor {
  readonly createdAt: Date;
  readonly id: string;
}

export interface AdministrationPage<T> {
  readonly items: readonly T[];
  readonly next: AdministrationCursor | null;
}
