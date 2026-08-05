import type {
  ClinicHoursProjection,
  DoctorScheduleProjection,
} from './doctor-schedule';

export interface ScheduleReadScope {
  readonly organizationId?: string | undefined;
  readonly clinicId?: string | undefined;
  readonly doctorActorId?: string | undefined;
  readonly clinicAssignmentVisibility: 'active' | 'activeOrInactive';
}

export interface ScheduleReadWindow {
  readonly startsAt: Date;
  readonly endsAt: Date;
}

export interface DoctorScheduleRepository {
  findDoctorSchedule(
    doctorId: string,
    scope: ScheduleReadScope,
    window: ScheduleReadWindow,
  ): Promise<DoctorScheduleProjection | null>;
  findClinicHours(
    clinicId: string,
    scope: ScheduleReadScope,
  ): Promise<ClinicHoursProjection | null>;
  recordReads(
    inputs: readonly {
      readonly actorId: string;
      readonly organizationId: string;
      readonly clinicId?: string | undefined;
      readonly targetType: 'Doctor' | 'Clinic';
      readonly targetId: string;
      readonly requestId: string;
      readonly action: 'schedule.viewed' | 'availability.viewed';
    }[],
  ): Promise<void>;
}

export const DOCTOR_SCHEDULE_REPOSITORY = Symbol('DOCTOR_SCHEDULE_REPOSITORY');
