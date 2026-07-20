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
}

void grant().finally(() => client.end());
