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
if (!/^[a-z][a-z0-9_]{2,62}$/.test(role))
  throw new Error('Unsafe runtime role name.');
const quotedRole = `"${role}"`;
const client = new Client({ connectionString: adminUrl.toString() });

async function grant(): Promise<void> {
  await client.connect();
  await client.query(`GRANT USAGE ON SCHEMA public TO ${quotedRole}`);
  await client.query(
    `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${quotedRole}`,
  );
  await client.query(
    `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${quotedRole}`,
  );
  await client.query(
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${quotedRole}`,
  );
  await client.query(
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${quotedRole}`,
  );
  await client.query(
    `REVOKE DELETE ON TABLE public.appointment_arrivals FROM ${quotedRole}`,
  );
  await client.query(
    `REVOKE UPDATE, DELETE ON TABLE public.arrival_audits FROM ${quotedRole}`,
  );
  await client.query(
    `REVOKE INSERT, UPDATE, DELETE ON TABLE
      public.queue_sessions, public.queue_entries,
      public.queue_activities, public.queue_audits FROM ${quotedRole}`,
  );
  await client.query(
    `GRANT UPDATE (
      status, next_ticket, opened_at, paused_at, closed_at, pause_reason,
      version, updated_at
    ) ON TABLE public.queue_sessions TO ${quotedRole}`,
  );
  await client.query(
    `GRANT UPDATE (
      status, called_at, recalled_at, consultation_started_at, completed_at,
      no_response_at, recall_deadline_at, version, updated_at
    ) ON TABLE public.queue_entries TO ${quotedRole}`,
  );
  await client.query(
    `GRANT INSERT ON TABLE public.queue_activities, public.queue_audits TO ${quotedRole}`,
  );
  await client.query(
    `REVOKE EXECUTE ON FUNCTION
      public.queue_create_session(uuid,uuid,uuid,date,text)
      FROM ${quotedRole}`,
  );
  await client.query(
    `GRANT EXECUTE ON FUNCTION
      public.queue_create_session(uuid,uuid,uuid,date,text,integer),
      public.queue_create_entry(uuid,uuid,uuid,uuid,uuid,uuid,integer)
      TO ${quotedRole}`,
  );
  await client.query(
    `REVOKE UPDATE, DELETE ON TABLE public.audit_events FROM ${quotedRole}`,
  );
  await client.query(
    `REVOKE UPDATE, DELETE ON TABLE public.notification_records FROM ${quotedRole}`,
  );
  await client.query(
    `REVOKE ALL ON TABLE public.notification_record_archive FROM ${quotedRole}`,
  );
  await client.query(
    `REVOKE UPDATE, DELETE ON TABLE public.outbox_events FROM ${quotedRole}`,
  );
  await client.query(
    `GRANT UPDATE (
      published_at, attempts, next_attempt_at, failed_at, last_error_code
    ) ON TABLE public.outbox_events TO ${quotedRole}`,
  );
  await client.query(
    `GRANT EXECUTE ON FUNCTION
      public.notification_mark_read(uuid,uuid,timestamptz)
      TO ${quotedRole}`,
  );
}

void grant().finally(() => client.end());
