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
    session_insert: boolean;
    entry_insert: boolean;
    session_delete: boolean;
    entry_delete: boolean;
    activity_update: boolean;
    audit_update: boolean;
    create_session: boolean;
    create_entry: boolean;
  }>(
    `SELECT
      has_table_privilege($1, 'queue_sessions', 'INSERT') AS session_insert,
      has_table_privilege($1, 'queue_entries', 'INSERT') AS entry_insert,
      has_table_privilege($1, 'queue_sessions', 'DELETE') AS session_delete,
      has_table_privilege($1, 'queue_entries', 'DELETE') AS entry_delete,
      has_table_privilege($1, 'queue_activities', 'UPDATE') AS activity_update,
      has_table_privilege($1, 'queue_audits', 'UPDATE') AS audit_update,
      has_function_privilege(
        $1,
        'queue_create_session(uuid,uuid,uuid,date,text,integer)',
        'EXECUTE'
      ) AS create_session,
      has_function_privilege(
        $1,
        'queue_create_entry(uuid,uuid,uuid,uuid,uuid,uuid,integer)',
        'EXECUTE'
      ) AS create_entry`,
    [role],
  );
  const grants = result.rows[0];
  if (
    !grants ||
    grants.session_insert ||
    grants.entry_insert ||
    grants.session_delete ||
    grants.entry_delete ||
    grants.activity_update ||
    grants.audit_update ||
    !grants.create_session ||
    !grants.create_entry
  )
    throw new Error('Queue runtime privileges are unsafe.');
}

void verify().finally(() => client.end());
