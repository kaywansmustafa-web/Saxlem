import type {
  DoctorDiscoveryOptionsProjection,
  DoctorProjection,
} from './doctor';

export type DoctorClinicAssignmentVisibility = 'active' | 'activeOrInactive';

export interface DoctorSearchCriteria {
  readonly organizationId?: string | undefined;
  readonly clinicId?: string | undefined;
  readonly specialty?: string | undefined;
  readonly language?: string | undefined;
  readonly gender?: 'female' | 'male' | 'unspecified' | undefined;
  readonly status: 'active' | 'inactive';
  readonly minimumYearsOfExperience?: number | undefined;
  readonly name?: string | undefined;
  readonly page: number;
  readonly pageSize: number;
  readonly clinicAssignmentVisibility: DoctorClinicAssignmentVisibility;
}

export interface DoctorRepository {
  search(criteria: DoctorSearchCriteria): Promise<{
    readonly items: readonly DoctorProjection[];
    readonly total: number;
  }>;
  discoveryOptions(
    criteria: Pick<
      DoctorSearchCriteria,
      'organizationId' | 'clinicId' | 'clinicAssignmentVisibility'
    >,
  ): Promise<DoctorDiscoveryOptionsProjection>;
  find(
    id: string,
    criteria: {
      readonly organizationId?: string | undefined;
      readonly clinicId?: string | undefined;
      readonly visibility: 'active' | 'activeOrInactive';
      readonly clinicAssignmentVisibility: DoctorClinicAssignmentVisibility;
    },
  ): Promise<DoctorProjection | null>;
  recordView(input: {
    readonly actorId: string;
    readonly organizationId: string;
    readonly clinicId?: string | undefined;
    readonly doctorId: string;
    readonly requestId: string;
    readonly action:
      | 'doctor.details.viewed'
      | 'doctor.profile.viewed'
      | 'doctor.specialties.viewed';
  }): Promise<void>;
}

export const DOCTOR_REPOSITORY = Symbol('DOCTOR_REPOSITORY');
