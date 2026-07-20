import { readFileSync } from 'node:fs';
import { join } from 'node:path';
describe('appointment domain architecture', () => {
  const source = (path: string) =>
    readFileSync(join(process.cwd(), path), 'utf8');
  it('keeps Prisma behind the repository and reuses schedule validation', () => {
    const presentation = source(
      'src/modules/appointments/presentation/appointments.controller.ts',
    );
    const service = source(
      'src/modules/appointments/application/appointment.service.ts',
    );
    expect(presentation).not.toContain('@prisma/client');
    expect(service).not.toContain('@prisma/client');
    expect(service).toContain('assertBookable');
  });
  it('contains no queue, notification, billing, or realtime behavior', () => {
    const module = source(
      'src/modules/appointments/appointments.module.ts',
    ).toLowerCase();
    for (const forbidden of [
      'queue',
      'notification',
      'billing',
      'payment',
      'realtime',
    ])
      expect(module).not.toContain(forbidden);
  });
  it('enforces overlap, immutable references, active context, and optimistic versions', () => {
    const migration = source(
      'prisma/migrations/20260721010000_appointment_domain_foundation/migration.sql',
    );
    for (const invariant of [
      'appointments_doctor_no_overlap',
      'appointments_patient_no_overlap',
      'appointment_reference_immutable',
      'appointment_active_context',
    ])
      expect(migration).toContain(invariant);
    const repository = source(
      'src/modules/appointments/infrastructure/prisma-appointment.repository.ts',
    );
    expect(repository).toContain('version');
  });
  it('publishes every approved versioned route in OpenAPI', () => {
    const document = JSON.parse(source('openapi/saxlem-api.json')) as {
      paths: Record<string, unknown>;
    };
    for (const route of [
      '/api/v1/appointments',
      '/api/v1/appointments/{id}',
      '/api/v1/appointments/{id}/cancel',
      '/api/v1/appointments/{id}/reschedule',
    ])
      expect(document.paths).toHaveProperty(route);
  });
  it('keeps authoritative pricing read-only and documents mutation safety contracts', () => {
    const document = JSON.parse(source('openapi/saxlem-api.json')) as {
      components: {
        schemas: Record<string, { properties?: Record<string, unknown> }>;
      };
      paths: Record<
        string,
        Record<
          string,
          {
            parameters?: { name?: string }[];
            responses?: Record<string, unknown>;
          }
        >
      >;
    };
    expect(
      document.components.schemas.CreateAppointmentDto!.properties,
    ).not.toHaveProperty('feeIqd');
    expect(
      document.components.schemas.AppointmentResponseDto!.properties,
    ).toHaveProperty('feeIqd');
    for (const [route, method] of [
      ['/api/v1/appointments', 'post'],
      ['/api/v1/appointments/{id}', 'patch'],
      ['/api/v1/appointments/{id}/cancel', 'post'],
      ['/api/v1/appointments/{id}/reschedule', 'post'],
    ] as const) {
      const operation = document.paths[route]![method]!;
      expect(operation.parameters).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Idempotency-Key' }),
        ]),
      );
      expect(operation.responses).toHaveProperty('409');
      expect(operation.responses).toHaveProperty('503');
    }
  });
});
