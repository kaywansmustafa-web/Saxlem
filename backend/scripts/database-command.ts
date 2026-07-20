import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { assertSafeDatabaseUrl } from './database-safety';

const command = process.argv[2];
const test = command === 'reset-test';
if (!test && command !== 'migrate-development')
  throw new Error('Unknown database command.');
const source = test
  ? process.env.TEST_DATABASE_URL
  : process.env.MIGRATION_DATABASE_URL;
assertSafeDatabaseUrl(source, test ? 'test' : 'development');
const args = test
  ? ['prisma', 'migrate', 'reset', '--force']
  : ['prisma', 'migrate', 'deploy'];
const result = spawnSync(
  process.execPath,
  [join(process.cwd(), 'node_modules/prisma/build/index.js'), ...args.slice(1)],
  {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: source },
  },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
