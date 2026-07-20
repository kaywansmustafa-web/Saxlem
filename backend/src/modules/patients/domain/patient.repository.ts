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

export interface PatientRepository {
  accountForUser(userId: string): Promise<AccountRecord | null>;
  profiles(accountId: string): Promise<readonly ProfileRecord[]>;
  profile(accountId: string, profileId: string): Promise<ProfileRecord | null>;
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
