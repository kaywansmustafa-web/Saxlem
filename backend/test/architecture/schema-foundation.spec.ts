import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('tenant-safe schema foundation', () => {
  const schema = readFileSync(
    join(process.cwd(), 'prisma/schema.prisma'),
    'utf8',
  );
  const migration = readFileSync(
    join(
      process.cwd(),
      'prisma/migrations/20260717000000_backend_foundation/migration.sql',
    ),
    'utf8',
  );

  it('uses Prisma-supported UUIDv7 identifiers', () => {
    expect(schema).toContain('@default(uuid(7))');
  });

  it('requires tenant identifiers on clinic operational aggregates', () => {
    for (const model of ['Appointment', 'QueueSession', 'ClinicMembership']) {
      const block = schema.match(
        new RegExp(`model ${model} \\{[\\s\\S]*?\\n\\}`),
      )?.[0];
      expect(block).toContain('organizationId');
      expect(block).toContain('clinicId');
    }
  });

  it('protects one active consultation per queue in SQL', () => {
    expect(migration).toContain('queue_entries_single_active_consultation');
  });
});
