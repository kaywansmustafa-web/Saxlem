import { PlatformControlService } from '../../src/modules/platform-control/application/platform-control.service';
import type { PrismaService } from '../../src/infrastructure/database/prisma.service';
import {
  apiPrisma,
  createApiTenant,
  createRolePrincipal,
} from './live-queue-api-fixture';

describe('platform control patient privacy', () => {
  const service = new PlatformControlService(
    { db: apiPrisma } as unknown as PrismaService,
    {} as never,
    {} as never,
    {} as never,
  );

  afterAll(async () => {
    await apiPrisma.$disconnect();
  });

  async function fixture() {
    const tenant = await createApiTenant(`platform-privacy-${Date.now()}`);
    const admin = await createRolePrincipal('platformAdministrator', tenant);
    const patient = await createRolePrincipal('patient', tenant);
    const account = await apiPrisma.patientAccount.findUniqueOrThrow({
      where: { userId: patient.userId },
    });
    const lastName = `Privacy${Date.now()}`;
    await apiPrisma.patientProfile.create({
      data: {
        patientAccountId: account.id,
        firstName: 'Zirvan',
        lastName,
        dateOfBirth: new Date('1990-01-01T00:00:00.000Z'),
      },
    });
    return { admin, account, lastName };
  }

  async function auditsFor(actorUserId: string, requestId: string) {
    return apiPrisma.auditEvent.findMany({
      where: { actorUserId, requestId },
    });
  }

  it('does not search patient names with fewer than 3 characters', async () => {
    const { admin } = await fixture();
    const results = await service.search(
      admin.userId,
      { q: 'Zi', limit: 10 },
      'privacy-short-search',
    );
    expect(results.some((x) => x.category === 'patient')).toBe(false);
    expect(await auditsFor(admin.userId, 'privacy-short-search')).toHaveLength(
      0,
    );
  });

  it('audits global searches that reveal patients without storing the query', async () => {
    const { admin, account, lastName } = await fixture();
    const results = await service.search(
      admin.userId,
      { q: lastName, limit: 10 },
      'privacy-name-search',
    );
    expect(
      results.filter((x) => x.category === 'patient').map((x) => x.id),
    ).toEqual([account.id]);
    const audits = await auditsFor(admin.userId, 'privacy-name-search');
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({
      action: 'patient.search-viewed',
      metadata: { resultCount: 1 },
    });
    expect(JSON.stringify(audits[0]?.metadata)).not.toContain(lastName);
  });

  it('requires 7+ phone digits and matches the number ending only', async () => {
    const { admin, account } = await fixture();
    const digits = account.normalizedPhoneNumber.replace(/\D/g, '');
    const fragment = digits.slice(3, 7);
    const short = await service.patients(
      admin.userId,
      { search: fragment, pageSize: 50 },
      'privacy-phone-fragment',
    );
    expect(short.items.map((x) => x.accountId)).not.toContain(account.id);

    const ending = digits.slice(-9);
    const full = await service.patients(
      admin.userId,
      { search: ending, pageSize: 50 },
      'privacy-phone-ending',
    );
    expect(full.items.map((x) => x.accountId)).toContain(account.id);
    expect(full.items[0]?.maskedPhone).not.toContain(ending);
    const audits = await auditsFor(admin.userId, 'privacy-phone-ending');
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({
      action: 'patient.directory-searched',
      metadata: { searchKind: 'phone' },
    });
    expect(JSON.stringify(audits[0]?.metadata)).not.toContain(ending);
  });
});
