import 'dotenv/config';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Client } from 'pg';
import { assertSafeDatabaseUrl } from '../../scripts/database-safety';

describe('Sprint 13J legacy notification migration', () => {
  it('preserves scoped records and archives every unscoped legacy shape', async () => {
    const base = assertSafeDatabaseUrl(process.env.TEST_DATABASE_URL, 'test');
    const database = `saxlem_notification_upgrade_${Date.now()}`;
    const admin = new Client({
      connectionString: withDatabase(base, 'postgres').toString(),
    });
    await admin.connect();
    await admin.query(`CREATE DATABASE "${database}"`);
    const target = new Client({
      connectionString: withDatabase(base, database).toString(),
    });
    try {
      await target.connect();
      const migrationRoot = join(process.cwd(), 'prisma', 'migrations');
      const migrations = readdirSync(migrationRoot)
        .filter((name) => name < '20260730090000_realtime_notifications')
        .sort();
      for (const migration of migrations)
        await target.query(
          readFileSync(join(migrationRoot, migration, 'migration.sql'), 'utf8'),
        );

      const organizationId = randomUUID();
      const clinicId = randomUUID();
      const userId = randomUUID();
      const existingOutboxId = randomUUID();
      await target.query(
        `INSERT INTO organizations (
           id, name, created_at, updated_at
         ) VALUES ($1, 'Upgrade Org', now(), now())`,
        [organizationId],
      );
      await target.query(
        `INSERT INTO clinics (
           id, organization_id, name, code, timezone, created_at, updated_at
         ) VALUES (
           $1, $2, 'Upgrade Clinic', 'upgrade', 'Asia/Baghdad', now(), now()
         )`,
        [clinicId, organizationId],
      );
      await target.query(
        `INSERT INTO users (id, created_at, updated_at)
         VALUES ($1, now(), now())`,
        [userId],
      );
      await target.query(
        `INSERT INTO outbox_events (
           id, aggregate_type, aggregate_id, event_type, payload, occurred_at
         ) VALUES ($1, 'Existing', $1, 'existing.event', '{}', now())`,
        [existingOutboxId],
      );
      const scopedId = randomUUID();
      const organizationNullId = randomUUID();
      const clinicNullId = randomUUID();
      const bothNullId = randomUUID();
      await target.query(
        `INSERT INTO notification_records (
           id, organization_id, clinic_id, recipient_user_id,
           type, payload, occurred_at
         ) VALUES
           ($1, $5, $6, $7, 'legacy.scoped', '{}', now()),
           ($2, NULL, $6, $7, 'legacy.organization-null', '{}', now()),
           ($3, $5, NULL, $7, 'legacy.clinic-null', '{}', now()),
           ($4, NULL, NULL, $7, 'legacy.both-null', '{}', now());`,
        [
          scopedId,
          organizationNullId,
          clinicNullId,
          bothNullId,
          organizationId,
          clinicId,
          userId,
        ],
      );
      await target.query(
        readFileSync(
          join(
            migrationRoot,
            '20260730090000_realtime_notifications',
            'migration.sql',
          ),
          'utf8',
        ),
      );

      const active = await target.query<{
        id: string;
        source_outbox_event_id: string;
      }>(
        `SELECT id, source_outbox_event_id
         FROM notification_records`,
      );
      expect(active.rows).toHaveLength(1);
      expect(active.rows[0]?.id).toBe(scopedId);
      expect(active.rows[0]?.source_outbox_event_id).not.toBe(scopedId);
      expect(active.rows[0]?.source_outbox_event_id).not.toBe(existingOutboxId);
      const archive = await target.query<{ id: string }>(
        `SELECT id FROM notification_record_archive ORDER BY id`,
      );
      expect(new Set(archive.rows.map(({ id }) => id))).toEqual(
        new Set([organizationNullId, clinicNullId, bothNullId]),
      );
      expect(
        Number(
          (
            await target.query<{ count: string }>(
              `SELECT
                 (SELECT count(*) FROM notification_records) +
                 (SELECT count(*) FROM notification_record_archive) AS count`,
            )
          ).rows[0]?.count,
        ),
      ).toBe(4);
      expect(
        (
          await target.query<{ event_type: string }>(
            `SELECT event_type FROM outbox_events WHERE id = $1`,
            [existingOutboxId],
          )
        ).rows[0]?.event_type,
      ).toBe('existing.event');
    } finally {
      await target.end().catch(() => undefined);
      await admin.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`);
      await admin.end();
    }
  });
});

function withDatabase(url: URL, database: string): URL {
  const copy = new URL(url.toString());
  copy.pathname = `/${database}`;
  return copy;
}
