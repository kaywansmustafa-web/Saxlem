import 'dotenv/config';
import { assertSafeDatabaseUrl } from '../../scripts/database-safety';

const url = assertSafeDatabaseUrl(process.env.TEST_DATABASE_URL, 'test');
process.env.DATABASE_URL = url.toString();
