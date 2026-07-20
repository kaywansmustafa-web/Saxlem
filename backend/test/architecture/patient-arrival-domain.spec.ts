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
  });

  it('publishes only the approved arrival route and contracts', () => {
    const document = JSON.parse(source('openapi/saxlem-api.json')) as {
      paths: Record<string, Record<string, unknown>>;
    };
    const path = document.paths['/api/v1/appointments/{id}/arrival'];
    expect(path).toBeDefined();
    expect(path).toHaveProperty('get');
    expect(path).toHaveProperty('post');
    expect(path).not.toHaveProperty('patch');
    expect(path).not.toHaveProperty('delete');
  });
});
