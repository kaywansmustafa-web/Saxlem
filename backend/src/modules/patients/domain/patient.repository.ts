import type { PatientGender, PatientRelationship } from './patient-profile';

export interface ProfileRecord {
  readonly id: string;
  readonly patientAccountId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly dateOfBirth: Date;
  readonly gender: PatientGender;
  readonly relationship: PatientRelationship;
  readonly status: 'active' | 'inactive';
  readonly version: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface AccountRecord {
  readonly id: string;
  readonly userId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly activeProfileId: string | null;
}

export interface ProfileInput {
  readonly firstName: string;
  readonly lastName: string;
  readonly dateOfBirth: Date;
  readonly gender: PatientGender;
  readonly relationship: PatientRelationship;
}

export interface PatientDirectoryAccess {
  readonly actorId: string;
  readonly organizationId: string;
  readonly clinicId: string;
}

export interface PatientDirectoryQuery {
  readonly q: string;
  readonly pageSize: number;
  readonly cursor?: string;
}

export interface PatientDirectoryCursorProjection {
  readonly organizationId: string;
  readonly clinicId: string;
  readonly query: string;
  readonly pageSize: number;
  readonly lastName: string;
  readonly firstName: string;
  readonly profileId: string;
}

export interface PatientDirectorySearchItem {
  readonly patientProfileId: string;
  readonly displayName: string;
  readonly active: boolean;
  readonly lastAppointmentAt: string | null;
  readonly nextAppointmentAt: string | null;
}

export interface PatientDirectoryRepositoryPage {
  readonly items: readonly PatientDirectorySearchItem[];
  readonly nextCursor: PatientDirectoryCursorProjection | null;
}

export interface PatientDirectorySearchPage {
  readonly items: readonly PatientDirectorySearchItem[];
  readonly nextCursor: string | null;
}

export interface PatientDirectoryAppointmentProjection {
  readonly appointmentId: string;
  readonly doctorId: string;
  readonly doctorName: string | null;
  readonly scheduledStartAt: string;
  readonly scheduledEndAt: string;
  readonly status: string;
  readonly version: number;
}

export interface PatientDirectoryDetailProjection {
  readonly patientProfileId: string;
  readonly displayName: string;
  readonly active: boolean;
  readonly appointments: {
    readonly upcoming: readonly PatientDirectoryAppointmentProjection[];
    readonly recent: readonly PatientDirectoryAppointmentProjection[];
  };
}

export interface PatientRepository {
  accountForUser(userId: string): Promise<AccountRecord | null>;
  profiles(accountId: string): Promise<readonly ProfileRecord[]>;
  profile(accountId: string, profileId: string): Promise<ProfileRecord | null>;
  searchDirectory(
    access: PatientDirectoryAccess,
    query: PatientDirectoryQuery,
    cursor: PatientDirectoryCursorProjection | undefined,
    requestId: string,
  ): Promise<PatientDirectoryRepositoryPage>;
  getDirectoryProfile(
    access: PatientDirectoryAccess,
    profileId: string,
    requestId: string,
  ): Promise<PatientDirectoryDetailProjection | null>;
  create(
    accountId: string,
    input: ProfileInput,
    requestId: string,
    actorId: string,
  ): Promise<ProfileRecord>;
  update(
    accountId: string,
    profileId: string,
    input: Omit<ProfileInput, 'relationship'>,
    version: number,
    requestId: string,
    actorId: string,
  ): Promise<ProfileRecord | null>;
  archive(
    accountId: string,
    profileId: string,
    version: number,
    requestId: string,
    actorId: string,
  ): Promise<ProfileRecord | null>;
  activate(
    accountId: string,
    profileId: string,
    requestId: string,
    actorId: string,
  ): Promise<void>;
}

export const PATIENT_REPOSITORY = Symbol('PATIENT_REPOSITORY');
