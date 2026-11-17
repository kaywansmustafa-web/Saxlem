import 'dotenv/config';
import { assertSafeDatabaseUrl } from '../../scripts/database-safety';

const url = assertSafeDatabaseUrl(process.env.TEST_DATABASE_URL, 'test');
process.env.DATABASE_URL = url.toString();
// Same as the app (PrismaService): sessions in UTC, so times written by the
// database (now(), defaults) read back correctly whatever the database's
// own time zone. node-postgres reads PGOPTIONS for every test client.
process.env.PGOPTIONS = '-c TimeZone=UTC';
