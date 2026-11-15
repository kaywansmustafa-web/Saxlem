import { PrismaBillingRepository } from '../../src/modules/billing/infrastructure/prisma-billing.repository';
import type { PrismaService } from '../../src/infrastructure/database/prisma.service';
import { apiPrisma } from './live-queue-api-fixture';

// Billing plan responses must contain exactly the fields BillingPlanResponseDto
// declares; the Clinic Portal and Owner Portal validate them strictly.
const declared = [
  'code',
  'commissionAmountIqd',
  'currency',
  'displayName',
  'id',
  'ruleCode',
  'ruleVersion',
  'status',
  'version',
];

describe('billing plan response contract', () => {
  const repository = new PrismaBillingRepository({
    db: apiPrisma,
  } as unknown as PrismaService);

  afterAll(async () => {
    await apiPrisma.$disconnect();
  });

  it('returns only the declared plan fields', async () => {
    const plans = await repository.plans();
    expect(plans.length).toBeGreaterThan(0);
    for (const plan of plans)
      expect(Object.keys(plan).sort()).toEqual(declared);
    const single = await repository.plan(plans[0]!.id);
    expect(Object.keys(single!).sort()).toEqual(declared);
  });
});
