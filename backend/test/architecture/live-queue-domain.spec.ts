import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('authoritative live queue architecture', () => {
  const read = (path: string) =>
    readFileSync(join(process.cwd(), path), 'utf8');

  it('keeps presentation behind application and repository boundaries', () => {
    const controller = read(
      'src/modules/queue/presentation/queue.controller.ts',
    );
    expect(controller).toContain('QueueService');
    expect(controller).not.toContain('PrismaService');
    expect(controller).not.toContain('mock');
  });

  it('has one permanent model with database lifecycle defenses', () => {
    const schema = read('prisma/schema.prisma');
    const migration = read(
      'prisma/migrations/20260729090000_live_queue_domain/migration.sql',
    );
    expect(schema.match(/model QueueSession \{/g) ?? []).toHaveLength(1);
    expect(schema.match(/model QueueEntry \{/g) ?? []).toHaveLength(1);
    expect(migration).toContain('queue_entries_single_current');
    expect(migration).toContain('enforce_queue_session_lifecycle');
    expect(migration).toContain('enforce_queue_entry_lifecycle');
    expect(migration).toContain('queue history is append-only');
    const hardening = read(
      'prisma/migrations/20260729120000_live_queue_structural_hardening/migration.sql',
    );
    expect(hardening).toContain('queue ticket counter is incoherent');
    expect(hardening).toContain('queue_activities_entry_scope_fkey');
    expect(hardening).toContain(
      'prevent_active_queue_participant_deactivation',
    );
    expect(hardening).toContain('SET search_path = pg_catalog, public');
  });

  it('documents idempotency only on mutation routes and requires it', () => {
    const document = JSON.parse(read('openapi/saxlem-api.json')) as {
      paths: Record<
        string,
        Record<
          string,
          { parameters?: Array<{ name?: string; required?: boolean }> }
        >
      >;
    };
    for (const [path, operations] of Object.entries(document.paths)) {
      if (!path.includes('queue')) continue;
      for (const [method, operation] of Object.entries(operations)) {
        const header = operation.parameters?.find(
          (parameter) => parameter.name === 'Idempotency-Key',
        );
        if (method === 'post') expect(header?.required).toBe(true);
        if (method === 'get') expect(header).toBeUndefined();
      }
    }
  });

  it('contains no common mojibake markers in queue sources, docs, or OpenAPI', () => {
    const values = [
      read('src/modules/queue/presentation/queue.controller.ts'),
      read('docs/LIVE_QUEUE_API.md'),
      read('docs/LIVE_QUEUE_DOMAIN.md'),
      read('openapi/saxlem-api.json'),
    ];
    for (const value of values) expect(value).not.toMatch(/â|Ã|Â|ï¿½|\uFFFD/u);
  });

  it('keeps platform administration read-only and patient DTOs safe', () => {
    const capabilities = read(
      'src/modules/identity/application/capabilities.ts',
    );
    const service = read('src/modules/queue/application/queue.service.ts');
    const repository = read(
      'src/modules/queue/infrastructure/prisma-queue.repository.ts',
    );
    expect(capabilities).toContain("'queue:patient-status:read'");
    expect(service).toContain('access.patient || access.platformAdministrator');
    expect(repository).not.toContain('reason: entry');
    expect(repository).not.toContain('phoneNumber');
  });
});
