import type { ClinicLocation } from '../../../common/clinics/clinic-location';
import type {
  DoctorDiscoveryOptionsProjection,
  DoctorProjection,
} from './doctor';

export type DoctorClinicAssignmentVisibility = 'active' | 'activeOrInactive';

export interface DoctorSearchCriteria {
  readonly organizationId?: string | undefined;
  readonly clinicId?: string | undefined;
  readonly specialty?: string | undefined;
  /** Any of these specialty codes (a Home tile links several). */
  readonly specialties?: readonly string[] | undefined;
  readonly language?: string | undefined;
  readonly gender?: 'female' | 'male' | 'unspecified' | undefined;
  readonly status: 'active' | 'inactive';
  readonly minimumYearsOfExperience?: number | undefined;
  readonly name?: string | undefined;
  readonly page: number;
  readonly pageSize: number;
  readonly clinicAssignmentVisibility: DoctorClinicAssignmentVisibility;
  /** Patients never see a doctor hidden for an overdue Saxlem balance. */
  readonly forPatients?: boolean;
}

export interface PublicClinicLocation extends ClinicLocation {
  readonly id: string;
  readonly name: string;
}

export interface DoctorRepository {
  /** An active clinic where at least one active doctor works, or null. */
  clinicLocation(clinicId: string): Promise<PublicClinicLocation | null>;
  search(criteria: DoctorSearchCriteria): Promise<{
    readonly items: readonly DoctorProjection[];
    readonly total: number;
  }>;
  discoveryOptions(
    criteria: Pick<
      DoctorSearchCriteria,
      | 'organizationId'
      | 'clinicId'
      | 'clinicAssignmentVisibility'
      | 'forPatients'
    >,
  ): Promise<DoctorDiscoveryOptionsProjection>;
  find(
    id: string,
    criteria: {
      readonly organizationId?: string | undefined;
      readonly clinicId?: string | undefined;
      readonly visibility: 'active' | 'activeOrInactive';
      readonly clinicAssignmentVisibility: DoctorClinicAssignmentVisibility;
      readonly forPatients?: boolean;
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
