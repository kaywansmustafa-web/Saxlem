import { BadRequestException } from '@nestjs/common';
import type { DoctorScheduleRepository } from '../domain/doctor-schedule.repository';
import { DoctorScheduleService } from './doctor-schedule.service';
import { TimezoneService } from './timezone.service';

describe('DoctorScheduleService booking offset policy', () => {
  const service = new DoctorScheduleService(
    {} as DoctorScheduleRepository,
    new TimezoneService(),
  );
  const validate = (instant: string, source: string) =>
    (
      service as unknown as {
        assertOffsetMatchesClinicTime: (
          value: Date,
          sourceValue: string,
          timezone: string,
        ) => void;
      }
    ).assertOffsetMatchesClinicTime(
      new Date(instant),
      source,
      'America/New_York',
    );

  it('rejects a nonexistent DST-gap wall time', () => {
    expect(() =>
      validate('2026-03-08T07:30:00.000Z', '2026-03-08T02:30:00-05:00'),
    ).toThrow(BadRequestException);
  });

  it('accepts either explicit offset for the repeated local hour', () => {
    expect(() =>
      validate('2026-11-01T05:30:00.000Z', '2026-11-01T01:30:00-04:00'),
    ).not.toThrow();
    expect(() =>
      validate('2026-11-01T06:30:00.000Z', '2026-11-01T01:30:00-05:00'),
    ).not.toThrow();
  });
});
