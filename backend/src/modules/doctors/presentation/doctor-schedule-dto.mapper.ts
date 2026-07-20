import { Injectable } from '@nestjs/common';
import type {
  AvailabilityProjection,
  ClinicHoursProjection,
  DoctorScheduleProjection,
  RecurringPeriodProjection,
  PublicAvailabilityState,
} from '../domain/doctor-schedule';
import type {
  ClinicHoursResponseDto,
  DoctorScheduleResponseDto,
  LocalPeriodResponseDto,
  ScheduleAvailabilityResponseDto,
} from './doctor-schedule.dto';

@Injectable()
export class DoctorScheduleDtoMapper {
  schedule(source: DoctorScheduleProjection): DoctorScheduleResponseDto {
    return {
      doctorId: source.doctorId,
      doctorName: source.doctorName,
      clinics: source.clinics.map((clinic) => ({
        clinicId: clinic.clinicId,
        clinicName: clinic.clinicName,
        timezone: clinic.timezone.identifier,
        clinicWorkingHours: clinic.workingHours.map((x) => this.local(x)),
        weeklyWorkingHours: clinic.weeklySchedule.map((x) => this.local(x)),
        breaks: clinic.breaks.map((x) => this.local(x)),
        leave: clinic.leave.map(({ startsAt, endsAt }) => ({
          startsAt,
          endsAt,
        })),
        holidays: clinic.holidays.map(({ name, startsAt, endsAt }) => ({
          name,
          startsAt,
          endsAt,
        })),
        exceptions: clinic.exceptions.map(({ kind, startsAt, endsAt }) => ({
          kind,
          startsAt,
          endsAt,
        })),
      })),
    };
  }

  availability(
    source: AvailabilityProjection,
  ): ScheduleAvailabilityResponseDto {
    return {
      doctorId: source.doctorId,
      evaluatedAt: source.evaluatedAt,
      clinics: source.clinics.map((clinic) => ({
        clinicId: clinic.clinicId,
        clinicName: clinic.clinicName,
        timezone: clinic.timezone,
        localDate: clinic.localDate,
        status: this.publicStatus(clinic.status),
        isWorkingNow: clinic.isWorkingNow,
      })),
    };
  }

  private publicStatus(
    status: AvailabilityProjection['clinics'][number]['status'],
  ): PublicAvailabilityState {
    return status === 'workingToday' || status === 'closedToday'
      ? status
      : 'unavailable';
  }

  clinicHours(source: ClinicHoursProjection): ClinicHoursResponseDto {
    return {
      clinicId: source.clinicId,
      clinicName: source.clinicName,
      timezone: source.timezone.identifier,
      workingHours: source.workingHours.map((x) => this.local(x)),
    };
  }

  private local(source: RecurringPeriodProjection): LocalPeriodResponseDto {
    return {
      weekday: source.weekday,
      startsAt: this.clock(source.startsMinute),
      endsAt: this.clock(source.endsMinute),
    };
  }

  private clock(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${remainder
      .toString()
      .padStart(2, '0')}`;
  }
}
