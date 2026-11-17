import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { BackendConfiguration } from '../../../config/environment';
import type { BillingRepository } from '../domain/billing.repository';
import { BillingService } from './billing.service';

describe('BillingService', () => {
  const repository = {
    plans: jest.fn(),
    plan: jest.fn(),
    organizationPlan: jest.fn(),
    assignPlan: jest.fn(),
    commissions: jest.fn(),
    statements: jest.fn(),
    statement: jest.fn(),
    currentStatements: jest.fn(),
    finalize: jest.fn(),
    createPlan: jest.fn(),
    setPlanStatus: jest.fn(),
    setup: jest.fn(),
    assignDoctorPlan: jest.fn(),
    setCycleStart: jest.fn(),
    creditCommission: jest.fn(),
    materializeCompletion: jest.fn(),
  } as jest.Mocked<BillingRepository>;
  const configuration = {
    auditHashSecret: 'billing-test-audit-secret-with-32-characters',
  } as BackendConfiguration;
  const platform = {
    actorId: '11111111-1111-4111-8111-111111111111',
    platformAdministrator: true,
  };
  const manager = {
    actorId: '22222222-2222-4222-8222-222222222222',
    platformAdministrator: false,
    organizationId: '33333333-3333-4333-8333-333333333333',
    clinicId: '44444444-4444-4444-8444-444444444444',
  };

  beforeEach(() => jest.resetAllMocks());

  it('enforces organization-scoped manager reads and platform-only mutations', async () => {
    const service = new BillingService(repository, configuration);
    await expect(
      service.commissions(manager, '55555555-5555-4555-8555-555555555555', 50),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(() =>
      service.assignPlan(
        manager,
        manager.organizationId,
        '66666666-6666-4666-8666-666666666666',
        new Date(),
        1,
        'operation-key',
        'request',
      ),
    ).toThrow(ForbiddenException);
  });

  it('signs cursors and rejects tampering and foreign bindings', async () => {
    repository.commissions
      .mockResolvedValueOnce({
        items: [],
        next: {
          recognizedAt: new Date('2026-08-10T08:00:00.000Z'),
          id: '77777777-7777-4777-8777-777777777777',
        },
      })
      .mockResolvedValue({ items: [], next: null });
    const service = new BillingService(repository, configuration);
    const first = await service.commissions(
      manager,
      manager.organizationId,
      50,
    );
    expect(first.nextCursor).toMatch(/^[^.]+\.[^.]+$/u);
    await service.commissions(
      manager,
      manager.organizationId,
      50,
      first.nextCursor!,
    );
    await expect(
      service.commissions(
        platform,
        manager.organizationId,
        50,
        first.nextCursor!,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    const [payload, signature] = first.nextCursor!.split('.');
    await expect(
      service.commissions(
        manager,
        manager.organizationId,
        50,
        `${payload}.${signature}x`,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('uses exact Baghdad calendar-month UTC boundaries', async () => {
    repository.currentStatements.mockResolvedValue([]);
    const service = new BillingService(repository, configuration);
    await service.currentStatements(
      platform,
      manager.organizationId,
      undefined,
      new Date('2026-08-31T21:30:00.000Z'),
    );
    expect(repository.currentStatements.mock.calls[0]).toEqual([
      platform,
      manager.organizationId,
      {
        start: new Date('2026-08-31T21:00:00.000Z'),
        end: new Date('2026-09-30T21:00:00.000Z'),
      },
      undefined,
    ]);
  });

  it('lets only Saxlem manage plans, with sane prices and dates', async () => {
    const service = new BillingService(repository, configuration);
    const now = new Date('2026-11-17T09:00:00.000Z');
    expect(() =>
      service.createPlan(
        manager,
        { displayName: 'Pilot', commissionAmountIqd: 0 },
        'r',
      ),
    ).toThrow(ForbiddenException);
    expect(() =>
      service.createPlan(
        platform,
        { displayName: ' ', commissionAmountIqd: 0 },
        'r',
      ),
    ).toThrow(BadRequestException);
    expect(() =>
      service.createPlan(
        platform,
        { displayName: 'Big', commissionAmountIqd: -5 },
        'r',
      ),
    ).toThrow(BadRequestException);
    repository.createPlan.mockResolvedValue({ id: 'plan' });
    await service.createPlan(
      platform,
      { displayName: ' Free pilot ', commissionAmountIqd: 0 },
      'r',
    );
    expect(repository.createPlan.mock.calls[0]?.[1]).toEqual({
      displayName: 'Free pilot',
      commissionAmountIqd: 0,
    });
    // Plan changes start at Baghdad midnight, today or later.
    expect(service.fromDay('2026-11-17', now).toISOString()).toBe(
      '2026-11-16T21:00:00.000Z',
    );
    expect(() => service.fromDay('2026-11-16', now)).toThrow(
      BadRequestException,
    );
    expect(() => service.creditCommission(platform, 'c', '  ', 'r')).toThrow(
      BadRequestException,
    );
    await expect(
      service.setCycleStart(
        platform,
        manager.organizationId,
        '2026-12-01',
        'r',
        now,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
