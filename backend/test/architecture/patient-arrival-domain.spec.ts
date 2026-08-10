import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('patient arrival domain architecture', () => {
  const source = (path: string) =>
    readFileSync(join(process.cwd(), path), 'utf8');

  it('keeps Prisma behind the repository and consumes AppointmentService', () => {
    const controller = source(
      'src/modules/arrivals/presentation/arrivals.controller.ts',
    );
    const service = source(
      'src/modules/arrivals/application/arrival.service.ts',
    );
    expect(controller).not.toContain('@prisma/client');
    expect(service).not.toContain('@prisma/client');
    expect(service).toContain('AppointmentService');
  });

  it('contains no queue mutation or unrelated product behavior', () => {
    const repository = source(
      'src/modules/arrivals/infrastructure/prisma-arrival.repository.ts',
    ).toLowerCase();
    for (const forbidden of [
      'queueentry.',
      'queuesession.',
      'notification.',
      'billing',
      'payment',
      'consultation',
    ])
      expect(repository).not.toContain(forbidden);
  });

  it('enforces exact transitions, optimistic concurrency, and append-only audit', () => {
    const migration = source(
      'prisma/migrations/20260721030000_patient_arrival_domain/migration.sql',
    );
    expect(migration).toContain(
      `OLD."status" = 'expected' AND NEW."status" = 'arrived'`,
    );
    expect(migration).toContain(
      `OLD."status" = 'arrived' AND NEW."status" = 'queueReady'`,
    );
    expect(migration).toContain('NEW."version" <> OLD."version" + 1');
    expect(migration).toContain('arrival_audit_append_only');
    const hardening = source(
      'prisma/migrations/20260721031000_patient_arrival_hardening/migration.sql',
    );
    expect(hardening).toContain(
      'Arrival requires an eligible active appointment context',
    );
    expect(hardening).toContain('arrival_audit_transition_guard');
    expect(hardening).toContain('arrival_audit_transition_key');
    expect(hardening).toContain('SET search_path = pg_catalog, public');
    const correction = source(
      'prisma/migrations/20260721031100_patient_arrival_eligibility_correction/migration.sql',
    );
    expect(correction).not.toContain('assignment."status"');
    expect(correction).not.toContain('registration."status"');
    expect(correction).toContain(
      'Arrival requires an eligible active appointment context',
    );
  });

  it('revalidates the locked schedule and participants inside the command transaction', () => {
    const repository = source(
      'src/modules/arrivals/infrastructure/prisma-arrival.repository.ts',
    );
    expect(repository).toContain('FOR UPDATE');
    expect(repository.match(/FOR SHARE/g)).toHaveLength(4);
    expect(repository).toContain('validateWindow(current.appointment.startsAt');
  });

  it('removes unnecessary runtime mutation privileges', () => {
    const grants = source('scripts/grant-runtime-role.ts');
    expect(grants).toContain(
      'REVOKE DELETE ON TABLE public.appointment_arrivals',
    );
    expect(grants).toContain(
      'REVOKE UPDATE, DELETE ON TABLE public.arrival_audits',
    );
  });

  it('publishes only the approved arrival route and contracts', () => {
    const document = JSON.parse(source('openapi/saxlem-api.json')) as {
      paths: Record<string, Record<string, unknown>>;
      components: {
        schemas: Record<
          string,
          {
            properties?: Record<string, Record<string, unknown>>;
            required?: string[];
          }
        >;
      };
    };
    const path = document.paths['/api/v1/appointments/{id}/arrival'];
    expect(path).toBeDefined();
    expect(path).toHaveProperty('get');
    expect(path).toHaveProperty('post');
    expect(path).not.toHaveProperty('patch');
    expect(path).not.toHaveProperty('delete');
    const arrival = document.components.schemas.ArrivalResponseDto!;
    const eligibility =
      document.components.schemas.ArrivalEligibilityResponseDto!;
    expect(arrival.properties?.id).toMatchObject({
      type: 'string',
      format: 'uuid',
    });
    expect(arrival.properties?.appointmentStartsAt).toMatchObject({
      type: 'string',
      format: 'date-time',
    });
    expect(arrival.properties?.status).toMatchObject({
      type: 'string',
      enum: ['expected', 'arrived', 'queueReady'],
    });
    for (const timestamp of ['arrivedAt', 'queueReadyAt'])
      expect(arrival.properties?.[timestamp]).toMatchObject({
        type: 'string',
        format: 'date-time',
        nullable: true,
      });
    expect(arrival.properties?.version).toMatchObject({
      type: 'integer',
      minimum: 1,
    });
    expect(arrival.properties?.arrivalEligibility).toMatchObject({
      allOf: [{ $ref: '#/components/schemas/ArrivalEligibilityResponseDto' }],
    });
    expect(arrival.required).not.toContain('arrivalEligibility');
    expect(eligibility.properties?.canArrive).toMatchObject({
      type: 'boolean',
    });
    expect(eligibility.properties?.reason).toMatchObject({
      type: 'string',
      enum: [
        'eligible',
        'tooEarly',
        'tooLate',
        'invalidAppointmentStatus',
        'alreadyArrived',
        'queueReady',
        'unavailable',
      ],
    });
    for (const boundary of ['opensAt', 'closesAt'])
      expect(eligibility.properties?.[boundary]).toMatchObject({
        type: 'string',
        format: 'date-time',
        nullable: true,
      });
  });
});
