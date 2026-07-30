import 'dotenv/config';
import { Client } from 'pg';
import { assertSafeDatabaseUrl } from './database-safety';

const adminUrl = assertSafeDatabaseUrl(
  process.env.MIGRATION_DATABASE_URL,
  'development',
);
const runtimeUrl = assertSafeDatabaseUrl(
  process.env.DATABASE_URL,
  'development',
);
const role = decodeURIComponent(runtimeUrl.username);
const client = new Client({ connectionString: adminUrl.toString() });

async function verify(): Promise<void> {
  await client.connect();
  const result = await client.query<{
    notificationDelete: boolean;
    notificationUpdate: boolean;
    notificationInsert: boolean;
    outboxDelete: boolean;
    outboxPublishedUpdate: boolean;
    outboxPayloadUpdate: boolean;
    notificationReadAtUpdate: boolean;
    notificationRecipientUpdate: boolean;
    markRead: boolean;
    publicMarkRead: boolean;
    archiveRead: boolean;
    archiveInsert: boolean;
  }>(
    `SELECT
      has_table_privilege($1, 'notification_records', 'DELETE')
        AS "notificationDelete",
      has_table_privilege($1, 'notification_records', 'UPDATE')
        AS "notificationUpdate",
      has_table_privilege($1, 'notification_records', 'INSERT')
        AS "notificationInsert",
      has_table_privilege($1, 'outbox_events', 'DELETE') AS "outboxDelete",
      has_column_privilege(
        $1, 'outbox_events', 'published_at', 'UPDATE'
      ) AS "outboxPublishedUpdate",
      has_column_privilege(
        $1, 'outbox_events', 'payload', 'UPDATE'
      ) AS "outboxPayloadUpdate",
      has_column_privilege(
        $1, 'notification_records', 'read_at', 'UPDATE'
      ) AS "notificationReadAtUpdate",
      has_column_privilege(
        $1, 'notification_records', 'recipient_user_id', 'UPDATE'
      ) AS "notificationRecipientUpdate",
      has_function_privilege(
        $1, 'notification_mark_read(uuid,uuid,timestamptz)', 'EXECUTE'
      ) AS "markRead",
      EXISTS (
        SELECT 1
        FROM information_schema.routine_privileges
        WHERE routine_schema = 'public'
          AND routine_name = 'notification_mark_read'
          AND grantee = 'PUBLIC'
          AND privilege_type = 'EXECUTE'
      ) AS "publicMarkRead",
      has_table_privilege(
        $1, 'notification_record_archive', 'SELECT'
      ) AS "archiveRead",
      has_table_privilege(
        $1, 'notification_record_archive', 'INSERT'
      ) AS "archiveInsert"`,
    [role],
  );
  const grants = result.rows[0];
  if (
    !grants ||
    grants.notificationDelete ||
    grants.notificationUpdate ||
    !grants.notificationInsert ||
    grants.outboxDelete ||
    !grants.outboxPublishedUpdate ||
    grants.outboxPayloadUpdate ||
    grants.notificationReadAtUpdate ||
    grants.notificationRecipientUpdate ||
    !grants.markRead ||
    grants.publicMarkRead ||
    grants.archiveRead ||
    grants.archiveInsert
  )
    throw new Error('Notification runtime privileges are unsafe.');
}

void verify().finally(() => client.end());
