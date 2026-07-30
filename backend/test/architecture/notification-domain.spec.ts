import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { capabilitiesFor } from '../../src/modules/identity/application/capabilities';
import { SUPPORTED_QUEUE_NOTIFICATION_EVENTS } from '../../src/modules/notifications/domain/notification';

const root = join(__dirname, '..', '..');

describe('Sprint 13J notification architecture', () => {
  it('uses the exact Live Queue event allowlist', () => {
    expect(SUPPORTED_QUEUE_NOTIFICATION_EVENTS).toEqual([
      'queue.session.opened',
      'queue.session.paused',
      'queue.session.resumed',
      'queue.session.closed',
      'queue.entry.enqueued',
      'queue.patient.called',
      'queue.patient.recalled',
      'queue.patient.no-response',
      'queue.consultation.started',
      'queue.consultation.completed',
    ]);
    expect(SUPPORTED_QUEUE_NOTIFICATION_EVENTS).not.toContain(
      'appointment.completedFromQueue' as never,
    );
  });

  it('does not grant notification access to platform administrators', () => {
    expect(capabilitiesFor('platformAdministrator')).not.toContain(
      'notifications:read',
    );
    for (const role of [
      'patient',
      'receptionist',
      'doctor',
      'clinicManager',
    ] as const) {
      expect(capabilitiesFor(role).has('notifications:read')).toBe(true);
      expect(capabilitiesFor(role).has('notifications:stream')).toBe(true);
      expect(capabilitiesFor(role).has('notifications:mark-read')).toBe(true);
    }
  });

  it('locks supported events with SKIP LOCKED and never imports queue internals', () => {
    const worker = readFileSync(
      join(
        root,
        'src/modules/notifications/infrastructure/notification-outbox.worker.ts',
      ),
      'utf8',
    );
    expect(worker).toContain('FOR UPDATE SKIP LOCKED');
    expect(worker).toContain('published_at IS NULL');
    expect(worker).not.toContain('appointment.completedFromQueue');
    expect(worker).not.toMatch(/patientName|phone|email|reason|diagnos|notes/i);
  });

  it('contains migration-level immutability and tenant integrity', () => {
    const migration = readFileSync(
      join(
        root,
        'prisma/migrations/20260730090000_realtime_notifications/migration.sql',
      ),
      'utf8',
    );
    expect(migration).toContain('notification_records_clinic_scope_fkey');
    expect(migration).toContain('notification_records_patient_scope_fkey');
    expect(migration).toContain('notification_records_immutable_fields');
    expect(migration).toContain('FOR EACH ROW');
    expect(migration).toContain('SECURITY DEFINER');
    expect(migration).toContain('SET search_path = pg_catalog, public');
    expect(migration).toContain('REVOKE ALL');
  });

  it('certifies versioned inbox, read, and SSE OpenAPI contracts', () => {
    const document = JSON.parse(
      readFileSync(join(root, 'openapi/saxlem-api.json'), 'utf8'),
    ) as {
      paths: Record<
        string,
        Record<
          string,
          {
            parameters?: Array<{
              name?: string;
              required?: boolean;
              description?: string;
              schema?: {
                type?: string;
                minLength?: number;
                maxLength?: number;
                default?: unknown;
              };
            }>;
            responses?: Record<
              string,
              { content?: Record<string, { schema?: { type?: string } }> }
            >;
          }
        >
      >;
      components: { schemas: Record<string, unknown> };
    };
    const inbox = document.paths['/api/v1/notifications']?.get;
    const read =
      document.paths['/api/v1/notifications/{notificationId}/read']?.post;
    const stream = document.paths['/api/v1/notifications/stream']?.get;
    expect(inbox).toBeDefined();
    expect(
      inbox?.parameters?.find(({ name }) => name === 'unreadOnly')?.schema,
    ).toMatchObject({ type: 'boolean', default: false });
    expect(
      read?.parameters?.find(({ name }) => name === 'Idempotency-Key'),
    ).toMatchObject({
      name: 'Idempotency-Key',
      required: true,
      schema: { type: 'string', minLength: 8, maxLength: 128 },
    });
    expect(
      read?.parameters?.find(({ name }) => name === 'Idempotency-Key')
        ?.description,
    ).toContain('printable ASCII');
    expect(
      stream?.parameters?.filter(({ name }) => name === 'Last-Event-ID'),
    ).toHaveLength(1);
    expect(
      stream?.responses?.['200']?.content?.['text/event-stream']?.schema,
    ).toMatchObject({ type: 'string' });
    expect(stream?.responses?.['413']).toBeDefined();
    for (const name of ['NotificationItemDto', 'NotificationPageDto'])
      expect(document.components.schemas[name]).toBeDefined();
  });

  it('keeps notification source and generated OpenAPI free of mojibake', () => {
    for (const file of [
      join(
        root,
        'src/modules/notifications/presentation/notifications.controller.ts',
      ),
      join(root, 'openapi/saxlem-api.json'),
    ]) {
      const content = readFileSync(file, 'utf8');
      expect(content).not.toMatch(/Ã¢|â€“|Ã|â‚¬|â„¢/u);
    }
  });

  it('contains every Sprint 13J.2 certification scenario', () => {
    const workerCertification = readFileSync(
      join(root, 'test/integration/notification-worker.integration-spec.ts'),
      'utf8',
    );
    for (const required of [
      'clinic-manager-membership',
      'doctor-assignment',
      'patient-registration',
      'patient-ownership',
      "'user'",
      'staff-account',
      'deactivation commits before projection',
      'projection reaches serialization first',
      'exact-clinic recipient inclusion and cross-clinic isolation',
      'overlapping recipient locks and delayed-commit HTTP SSE replay',
      'non-overlapping recipient sets process concurrently',
      'Last-Event-ID',
      'pg_advisory_lock',
      'waitUntilPidBlocked',
    ])
      expect(workerCertification).toContain(required);
    const workerSource = readFileSync(
      join(
        root,
        'src/modules/notifications/infrastructure/notification-outbox.worker.ts',
      ),
      'utf8',
    );
    expect(workerSource).toContain(
      'const userIds = candidates.map(({ userId }) => userId).sort()',
    );
  });
});
