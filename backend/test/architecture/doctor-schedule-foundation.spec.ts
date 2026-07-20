import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('doctor schedule foundation architecture', () => {
  const source = (path: string) =>
    readFileSync(join(process.cwd(), path), 'utf8');

  it('keeps presentation read-only and independent from Prisma', () => {
    const presentation = [
      source('src/modules/doctors/presentation/doctors.controller.ts'),
      source('src/modules/doctors/presentation/clinic-hours.controller.ts'),
    ].join('\n');
    expect(presentation).not.toContain('@prisma/client');
    expect(presentation).toContain("@Get(':id/schedule')");
    expect(presentation).toContain("@Get(':id/availability')");
    expect(presentation).toContain("@Get(':id/hours')");
    for (const mutation of ['@Post(', '@Patch(', '@Delete('])
      expect(presentation).not.toContain(mutation);
  });

  it('declares all authoritative schedule tables and database invariants', () => {
    const migration = source(
      'prisma/migrations/20260720050000_doctor_schedule_foundation/migration.sql',
    );
    for (const table of [
      'clinic_working_hours',
      'doctor_weekly_schedule',
      'doctor_breaks',
      'doctor_leave',
      'doctor_holidays',
      'doctor_schedule_exceptions',
    ])
      expect(migration).toContain(`CREATE TABLE "${table}"`);
    expect(migration).toContain('doctor_weekly_schedule_no_overlap');
    expect(migration).toContain('doctor_breaks_no_overlap');
    expect(migration).toContain('doctor_status_schedule_guard');
    expect(migration).toContain('clinic_timezone_identifier');
    const hardening = source(
      'prisma/migrations/20260720060000_doctor_schedule_hardening/migration.sql',
    );
    expect(hardening).not.toContain('"clinic_id" WITH =,\n    "doctor_id"');
    expect(hardening).toContain('doctor_holidays_no_overlap');
    expect(hardening).toContain('clinic_hours_preserve_doctor_periods');
    expect(hardening).toContain('doctor_periods_preserve_breaks');
  });

  it('does not truncate bounded temporal projections or expose operational fields in patient DTOs', () => {
    const repository = source(
      'src/modules/doctors/infrastructure/prisma-doctor-schedule.repository.ts',
    );
    const dto = source(
      'src/modules/doctors/presentation/doctor-schedule.dto.ts',
    );
    expect(repository).not.toContain('take: 1000');
    const availability = dto.slice(
      dto.indexOf('export class ClinicAvailabilityResponseDto'),
      dto.indexOf('export class ScheduleAvailabilityResponseDto'),
    );
    for (const field of [
      'workingPeriods',
      'breakPeriods',
      'holidayName',
      'precedenceSource',
    ])
      expect(availability).not.toContain(field);
  });

  it('keeps appointment slots and mutation surfaces outside the module', () => {
    const module = source('src/modules/doctors/doctors.module.ts');
    expect(module.toLowerCase()).not.toContain('appointment');
    expect(module.toLowerCase()).not.toContain('slot');
  });

  it('publishes schedule semantics and standard errors in OpenAPI', () => {
    const document = JSON.parse(source('openapi/saxlem-api.json')) as {
      paths: Record<string, { get?: { responses: Record<string, unknown> } }>;
      components: { schemas: Record<string, unknown> };
    };
    for (const path of [
      '/api/v1/doctors/{id}/schedule',
      '/api/v1/doctors/{id}/availability',
      '/api/v1/clinics/{id}/hours',
    ]) {
      expect(document.paths[path]?.get).toBeDefined();
      expect(document.paths[path]?.get?.responses).toHaveProperty('200');
      expect(document.paths[path]?.get?.responses).toHaveProperty('401');
      expect(document.paths[path]?.get?.responses).toHaveProperty('403');
      expect(document.paths[path]?.get?.responses).toHaveProperty('404');
    }
    expect(document.components.schemas).toHaveProperty(
      'DoctorScheduleResponseDto',
    );
    expect(document.components.schemas).toHaveProperty(
      'ScheduleAvailabilityResponseDto',
    );
    expect(
      document.paths['/api/v1/doctors']?.get?.responses,
    ).not.toHaveProperty('503');
    expect(
      document.paths['/api/v1/doctors/{id}/schedule']?.get?.responses,
    ).toHaveProperty('503');
  });
});
