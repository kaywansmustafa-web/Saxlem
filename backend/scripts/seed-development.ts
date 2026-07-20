import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { assertSafeDatabaseUrl } from './database-safety';

const url = assertSafeDatabaseUrl(process.env.DATABASE_URL, 'development');
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url.toString() }),
});

async function seed(): Promise<void> {
  await prisma.organization.upsert({
    where: { id: '0198a000-0000-7000-8000-000000000001' },
    update: { name: 'Saxlem Fictional Verification Organization' },
    create: {
      id: '0198a000-0000-7000-8000-000000000001',
      name: 'Saxlem Fictional Verification Organization',
    },
  });
  await prisma.clinic.upsert({
    where: { id: '0198a000-0000-7000-8000-000000000002' },
    update: {
      name: 'Fictional Foundation Clinic',
      code: 'fictional-foundation',
      timezone: 'Asia/Baghdad',
    },
    create: {
      id: '0198a000-0000-7000-8000-000000000002',
      organizationId: '0198a000-0000-7000-8000-000000000001',
      name: 'Fictional Foundation Clinic',
      code: 'fictional-foundation',
      timezone: 'Asia/Baghdad',
    },
  });
}

void seed().finally(() => prisma.$disconnect());
