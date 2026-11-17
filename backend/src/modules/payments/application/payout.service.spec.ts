import { ForbiddenException } from '@nestjs/common';
import type { BackendConfiguration } from '../../../config/environment';
import type { PaymentAccess } from '../domain/payment';
import { baghdadMonth, type PayoutRepository } from '../domain/payout';
import { PayoutService } from './payout.service';

const admin: PaymentAccess = {
  actorId: 'admin',
  patient: false,
  doctor: false,
  platformAdministrator: true,
};
const staff: PaymentAccess = { ...admin, platformAdministrator: false };

class FakePayouts implements PayoutRepository {
  savedDoctorProfile: {
    payoutAccountName: string | null;
    payoutAccountNumber: string | null;
  } | null = null;
  ledger() {
    return Promise.resolve({ items: [], nextCursor: null });
  }
  organizations() {
    return Promise.resolve([{ id: 'org', name: 'Hillview' }]);
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

describe('payout rules', () => {
  it('uses Baghdad month boundaries for the payments ledger', () => {
    const { start, end } = baghdadMonth('2026-11');
    expect(start.toISOString()).toBe('2026-10-31T21:00:00.000Z');
    expect(end.toISOString()).toBe('2026-11-30T21:00:00.000Z');
  });
});

describe('PayoutService', () => {
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
