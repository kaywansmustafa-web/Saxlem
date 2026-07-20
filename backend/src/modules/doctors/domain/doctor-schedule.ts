export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type AvailabilityState =
  'workingToday' | 'closedToday' | 'onLeave' | 'holiday' | 'unavailable';
export type AvailabilityPrecedence =
  'exception' | 'leave' | 'holiday' | 'weeklySchedule' | 'none';
export type PublicAvailabilityState =
  'workingToday' | 'closedToday' | 'unavailable';

export interface RecurringPeriodProjection {
  readonly id: string;
  readonly weekday: Weekday;
  readonly startsMinute: number;
  readonly endsMinute: number;
}

export interface UtcPeriodProjection {
  readonly id: string;
  readonly startsAt: string;
  readonly endsAt: string;
}

export interface HolidayProjection extends UtcPeriodProjection {
  readonly name: string;
}

export interface ScheduleExceptionProjection extends UtcPeriodProjection {
  readonly kind: 'working' | 'closed';
}

export interface TimezoneConfiguration {
  readonly identifier: string;
  readonly instantStorage: 'UTC';
  readonly recurringRuleClock: 'clinicLocalWallClock';
}

export interface ClinicScheduleProjection {
  readonly clinicId: string;
  readonly clinicName: string;
  readonly timezone: TimezoneConfiguration;
  readonly workingHours: readonly RecurringPeriodProjection[];
  readonly weeklySchedule: readonly RecurringPeriodProjection[];
  readonly breaks: readonly RecurringPeriodProjection[];
  readonly leave: readonly UtcPeriodProjection[];
  readonly holidays: readonly HolidayProjection[];
  readonly exceptions: readonly ScheduleExceptionProjection[];
}

export interface DoctorScheduleProjection {
  readonly doctorId: string;
  readonly doctorName: string;
  readonly organizationId: string;
  readonly clinics: readonly ClinicScheduleProjection[];
}

export interface ClinicHoursProjection {
  readonly clinicId: string;
  readonly clinicName: string;
  readonly organizationId: string;
  readonly timezone: TimezoneConfiguration;
  readonly workingHours: readonly RecurringPeriodProjection[];
}

export interface ClinicAvailabilityProjection {
  readonly clinicId: string;
  readonly clinicName: string;
  readonly timezone: string;
  readonly localDate: string;
  readonly status: AvailabilityState;
  readonly isWorkingNow: boolean;
  readonly workingPeriods: readonly EffectiveWorkingPeriodProjection[];
  readonly breakPeriods: readonly RecurringPeriodProjection[];
  readonly holidayName: string | null;
  readonly precedenceSource: AvailabilityPrecedence;
}

export interface EffectiveWorkingPeriodProjection {
  readonly source: 'weeklySchedule' | 'exception';
  readonly timeBasis: 'clinicLocalWallClock' | 'UTC';
  readonly weekday: Weekday | null;
  readonly startsAt: string;
  readonly endsAt: string;
}

export interface AvailabilityProjection {
  readonly doctorId: string;
  readonly evaluatedAt: string;
  readonly clinics: readonly ClinicAvailabilityProjection[];
}
