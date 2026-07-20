export const patientRelationships = [
  'self',
  'mother',
  'father',
  'son',
  'daughter',
  'brother',
  'sister',
  'grandfather',
  'grandmother',
  'wife',
  'husband',
  'other',
] as const;
export type PatientRelationship = (typeof patientRelationships)[number];

export const patientGenders = ['female', 'male', 'unspecified'] as const;
export type PatientGender = (typeof patientGenders)[number];

export interface PatientProfileProjection {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly dateOfBirth: string;
  readonly gender: PatientGender;
  /** Flutter compatibility: backend `self` is exposed as `me`. */
  readonly relationship: Exclude<PatientRelationship, 'self'> | 'me';
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly active: boolean;
  readonly version: number;
}

export interface PatientAccountProjection {
  readonly id: string;
  readonly activeProfileId: string | null;
  readonly activeProfile: PatientProfileProjection | null;
  readonly profileCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export function apiRelationship(
  value: PatientRelationship,
): PatientProfileProjection['relationship'] {
  return value === 'self' ? 'me' : value;
}
