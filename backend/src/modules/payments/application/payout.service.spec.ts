import { ConflictException, ForbiddenException } from '@nestjs/common';
import type { BackendConfiguration } from '../../../config/environment';
import type { PaymentAccess } from '../domain/payment';
import {
  baghdadMonth,
  doctorBreakdown,
  payoutTotals,
  type PayoutInputs,
  type PayoutRepository,
  type PayoutTotals,
} from '../domain/payout';
import { PayoutService } from './payout.service';

const admin: PaymentAccess = {
  actorId: 'admin',
  patient: false,
  doctor: false,
  platformAdministrator: true,
};
const staff: PaymentAccess = { ...admin, platformAdministrator: false };

const pay = (id: string, amount: number, doctor = 'd1') => ({
  id,
  amountIqd: amount,
  doctorId: doctor,
  doctorName: doctor === 'd1' ? 'Dr. Avin' : 'Dr. Rawand',
});

class FakePayouts implements PayoutRepository {
  inputsValue: PayoutInputs = {
    organizationId: 'org',
    organizationName: 'Hillview',
    doctorId: 'd1',
    doctorName: 'Dr. Avin',
    payments: [pay('p1', 25000), pay('p2', 25000), pay('p3', 30000, 'd2')],
    clawbacks: [pay('p0', 25000)],
    commissionIqd: 3750,
    settled: null,
    settledPayments: [],
    profile: null,
    doctorProfile: null,
  };
  savedDoctorProfile: {
    payoutAccountName: string | null;
    payoutAccountNumber: string | null;
  } | null = null;
  settledWith: { expected: PayoutTotals; reference: string } | null = null;
  ledger() {
    return Promise.resolve({ items: [], nextCursor: null });
  }
  organizations() {
    return Promise.resolve([{ id: 'org', name: 'Hillview' }]);
  }
  payees() {
    return Promise.resolve([
      {
        organizationId: 'org',
        organizationName: 'Hillview',
        doctorId: 'd1',
        doctorName: 'Dr. Avin',
      },
      {
        organizationId: 'org',
        organizationName: 'Hillview',
        doctorId: 'd2',
        doctorName: 'Dr. Rawand',
      },
    ]);
  }
  payee(organizationId: string, doctorId: string) {
    return Promise.resolve(
      organizationId === 'org' && ['d1', 'd2'].includes(doctorId)
        ? {
            organizationId,
            organizationName: 'Hillview',
            doctorId,
            doctorName: doctorId === 'd1' ? 'Dr. Avin' : 'Dr. Rawand',
          }
        : null,
    );
  }
  doctorProfile() {
    return Promise.resolve(null);
  }
  saveDoctorProfile(
    organizationId: string,
    doctorId: string,
    input: {
      payoutAccountName: string | null;
      payoutAccountNumber: string | null;
    },
  ) {
    this.savedDoctorProfile = input;
    return Promise.resolve({ organizationId, doctorId, ...input, version: 1 });
  }
  inputs(_organizationId: string, doctorId: string) {
    return Promise.resolve({ ...this.inputsValue, doctorId });
  }
  settle(input: { expected: PayoutTotals; reference: string }) {
    this.settledWith = input;
    return Promise.resolve({
      id: 'payout-1',
      ...input.expected,
      reference: input.reference,
      note: null,
      settledAt: new Date('2026-12-02T08:00:00Z'),
    });
  }
  profile() {
    return Promise.resolve(null);
  }
  saveProfile(
    organizationId: string,
    input: {
      onlinePaymentsEnabled: boolean;
      payoutAccountName: string | null;
      payoutAccountNumber: string | null;
    },
  ) {
    return Promise.resolve({ organizationId, ...input, version: 1 });
  }
}

function setup() {
  const repository = new FakePayouts();
  const configuration = {
    paymentCollectionMode: 'platform',
    paymentsOnlineEnabled: true,
    paymentProviderFeeBps: 50,
    paymentFeePassedToClinic: true,
    paymentPlatformAccount: {
      provider: 'fib',
      environment: 'prod',
      clientId: 'saxlem-client-9876',
      clientSecret: 'secret-never-shown',
    },
  } as unknown as BackendConfiguration;
  return { repository, service: new PayoutService(repository, configuration) };
}
const december = new Date('2026-12-02T08:00:00Z');

describe('payout rules', () => {
  it('uses Baghdad month boundaries', () => {
    const { start, end } = baghdadMonth('2026-11');
    expect(start.toISOString()).toBe('2026-10-31T21:00:00.000Z');
    expect(end.toISOString()).toBe('2026-11-30T21:00:00.000Z');
    expect(() => baghdadMonth('2026-13')).toThrow();
  });

  it('nets refunds, the provider fee and commission from what was collected', () => {
    const { repository } = setup();
    expect(payoutTotals(repository.inputsValue, 50, true)).toEqual({
      grossCollectedIqd: 80000,
      clawbackIqd: 25000,
      providerFeeIqd: 400,
      commissionIqd: 3750,
      netPayableIqd: 50850,
      paymentCount: 3,
    });
    expect(payoutTotals(repository.inputsValue, 50, false).providerFeeIqd).toBe(
      0,
    );
  });

  it('breaks collections down by doctor', () => {
    const { repository } = setup();
    expect(doctorBreakdown(repository.inputsValue.payments)).toEqual([
      {
        doctorId: 'd1',
        doctorName: 'Dr. Avin',
        paymentCount: 2,
        grossIqd: 50000,
      },
      {
        doctorId: 'd2',
        doctorName: 'Dr. Rawand',
        paymentCount: 1,
        grossIqd: 30000,
      },
    ]);
  });
});

describe('PayoutService', () => {
  it('shows a month as open until it ends, then ready', async () => {
    const { service } = setup();
    expect(
      (await service.detail('org', 'd1', '2026-11', new Date('2026-11-20')))
        .status,
    ).toBe('open');
    const ready = await service.detail('org', 'd1', '2026-11', december);
    expect(ready.status).toBe('ready');
    expect(ready.doctorName).toBe('Dr. Avin');
  });

  it('lists one settlement per doctor and rejects unknown doctors', async () => {
    const { service } = setup();
    const summary = await service.summary('2026-11', december);
    expect(summary.items.map((item) => item.doctorId)).toEqual(['d1', 'd2']);
    await expect(
      service.detail('org', 'nobody', '2026-11', december),
    ).rejects.toThrow('Doctor was not found');
  });

  it('settles only a finished month with unchanged amounts', async () => {
    const { service, repository } = setup();
    const input = {
      month: '2026-11',
      expectedNetPayableIqd: 50850,
      reference: 'FIB-123',
    };
    await expect(
      service.settle(admin, 'org', 'd1', input, 'req', new Date('2026-11-20')),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      service.settle(
        admin,
        'org',
        'd1',
        { ...input, expectedNetPayableIqd: 1 },
        'req',
        december,
      ),
    ).rejects.toThrow('amounts changed');
    await expect(
      service.settle(staff, 'org', 'd1', input, 'req', december),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await service.settle(admin, 'org', 'd1', input, 'req', december);
    expect(repository.settledWith?.expected.netPayableIqd).toBe(50850);
    expect(repository.settledWith?.reference).toBe('FIB-123');
  });

  it('refuses a month with nothing in it, or one already settled', async () => {
    const { service, repository } = setup();
    repository.inputsValue = {
      ...repository.inputsValue,
      payments: [],
      clawbacks: [],
      commissionIqd: 0,
    };
    await expect(
      service.settle(
        admin,
        'org',
        'd1',
        { month: '2026-11', expectedNetPayableIqd: 0, reference: 'x' },
        'req',
        december,
      ),
    ).rejects.toThrow('nothing to settle');
    repository.inputsValue = {
      ...repository.inputsValue,
      settled: {
        id: 'p',
        grossCollectedIqd: 1,
        clawbackIqd: 0,
        providerFeeIqd: 0,
        commissionIqd: 0,
        netPayableIqd: 1,
        paymentCount: 1,
        reference: 'r',
        note: null,
        settledAt: december,
      },
    };
    await expect(
      service.settle(
        admin,
        'org',
        'd1',
        { month: '2026-11', expectedNetPayableIqd: 1, reference: 'x' },
        'req',
        december,
      ),
    ).rejects.toThrow('already settled');
  });

  it('never exposes the platform secret', () => {
    const { service } = setup();
    const settings = service.settings();
    expect(settings.platformAccount?.clientIdHint).toBe('…9876');
    expect(JSON.stringify(settings)).not.toContain('secret-never-shown');
  });

  it('masks payout account numbers', async () => {
    const { service } = setup();
    const saved = await service.saveProfile(
      admin,
      'org',
      {
        onlinePaymentsEnabled: true,
        payoutAccountName: 'Hillview LLC',
        payoutAccountNumber: 'IQ12 FIBI 0000 1234 5678',
      },
      'req',
    );
    expect(saved.payoutAccountNumberHint).toBe('…5678');
    expect(JSON.stringify(saved)).not.toContain('IQ12');
    const { service: second, repository } = setup();
    const doctor = await second.saveDoctorProfile(
      admin,
      'org',
      'd1',
      {
        payoutAccountName: 'Dr. Avin',
        payoutAccountNumber: 'IQ12 FIBI 0000 1234 9999',
      },
      'req',
    );
    expect(doctor.payoutAccountNumberHint).toBe('…9999');
    expect(repository.savedDoctorProfile?.payoutAccountNumber).toBe(
      'IQ12FIBI000012349999',
    );
    await expect(
      second.saveDoctorProfile(staff, 'org', 'd1', {}, 'req'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
