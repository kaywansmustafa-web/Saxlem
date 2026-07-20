export const doctorLanguages = [
  'badiniKurdish',
  'soraniKurdish',
  'arabic',
  'english',
  'turkish',
] as const;
export type DoctorLanguage = (typeof doctorLanguages)[number];
export type DoctorGender = 'female' | 'male' | 'unspecified';
export type DoctorStatus = 'active' | 'inactive';
export const maximumDoctorSearchPage = 10000;

export interface SpecialtyProjection {
  readonly id: string;
  readonly code: string;
  readonly displayName: string;
  readonly isPrimary: boolean;
}

export interface DoctorClinicProjection {
  readonly id: string;
  readonly name: string;
  readonly organizationId: string;
}

export interface DoctorAvailabilityProjection {
  readonly status: 'available' | 'unavailable';
  readonly acceptingNewPatients: boolean;
  readonly nextAvailableAt: string | null;
  readonly updatedAt: string | null;
}

export interface DoctorProjection {
  readonly id: string;
  readonly organizationId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly displayName: string;
  readonly fullName: string;
  readonly gender: DoctorGender;
  readonly status: DoctorStatus;
  readonly licenseNumber: string;
  readonly yearsOfExperience: number;
  readonly biography: string;
  readonly languages: readonly DoctorLanguage[];
  readonly profilePhotoKey: string | null;
  readonly profileImageUrl: null;
  readonly specialty: string;
  readonly specialties: readonly SpecialtyProjection[];
  readonly clinics: readonly DoctorClinicProjection[];
  readonly availability: DoctorAvailabilityProjection;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly version: number;
}

export interface DoctorPageProjection {
  readonly items: readonly DoctorProjection[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
}
