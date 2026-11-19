import { ConflictException, ForbiddenException } from '@nestjs/common';
import type { BackendConfiguration } from '../../../config/environment';
import type { AppointmentService } from '../../appointments/application/appointment.service';
import type { AppointmentProjection } from '../../appointments/domain/appointment';
import type {
  PaymentAccess,
  PaymentAccountRecord,
  PaymentRecord,
} from '../domain/payment';
import {
  PaymentGatewayError,
  type GatewayPaymentState,
  type PaymentGateway,
} from '../domain/payment-gateway';
import type {
  PaymentAccountWrite,
  PaymentAudit,
  PaymentPatch,
  PaymentRepository,
  PaymentWrite,
} from '../domain/payment.repository';
import { CredentialCipher } from '../infrastructure/credential-cipher';
import { PaymentService } from './payment.service';

const key = 'payment-key-0123456789-abcdefghijklmnop';
const patient: PaymentAccess = {
  actorId: 'patient-user',
  patient: true,
  doctor: false,
  platformAdministrator: false,
};
const reception: PaymentAccess = {
  actorId: 'reception-user',
  patient: false,
  doctor: false,
  platformAdministrator: false,
  organizationId: 'org',
  clinicId: 'clinic',
};
const admin: PaymentAccess = {
  actorId: 'admin-user',
  patient: false,
  doctor: false,
  platformAdministrator: true,
};

function appointment(status = 'scheduled'): AppointmentProjection {
  return {
    id: 'appt',
    reference: 'SX-2026-000001',
    organizationId: 'org',
    clinicId: 'clinic',
    clinicName: 'Clinic',
    doctorId: 'doc',
    doctorName: 'Dr',
    patientProfileId: 'pp',
    patientName: 'P',
    type: 'initial',
    origin: 'patientBooked',
    reason: 'General consultation',
    startsAt: '2026-12-01T09:00:00.000Z',
    endsAt: '2026-12-01T09:30:00.000Z',
    durationMinutes: 30,
    feeIqd: 25000,
    status: status as AppointmentProjection['status'],
    cancellationReason: null,
    version: 1,
  };
}

class FakeRepository implements PaymentRepository {
  record: PaymentRecord | null = null;
  accountRecord: PaymentAccountRecord | null = null;
  audits: string[] = [];
  appointmentStatus = 'scheduled';

  findByAppointment() {
    return Promise.resolve(this.record);
  }
  findByCallbackToken(token: string) {
    return Promise.resolve(
      this.record?.callbackToken === token ? this.record : null,
    );
  }
  listForAppointments() {
    return Promise.resolve(this.record ? [this.record] : []);
  }
  save(
    appt: { id: string; organizationId: string; clinicId: string },
    expectedVersion: number,
    write: PaymentWrite,
    callbackToken: string,
    audit: PaymentAudit,
  ) {
    if ((this.record?.version ?? 0) !== expectedVersion)
      return Promise.resolve(null);
    this.record = {
      id: 'payment',
      organizationId: appt.organizationId,
      clinicId: appt.clinicId,
      appointmentId: appt.id,
      appointmentStatus: this.appointmentStatus,
      ...write,
      payerName: null,
      payoutId: null,
      clawbackPayoutId: null,
      refundedAt: null,
      callbackToken,
      lastCheckedAt: null,
      version: expectedVersion + 1,
    };
    this.audits.push(audit.action);
    return Promise.resolve(this.record);
  }
  patch(record: PaymentRecord, patch: PaymentPatch, audit?: PaymentAudit) {
    if (!this.record || this.record.version !== record.version)
      return Promise.resolve(null);
    this.record = { ...this.record, ...patch, version: record.version + 1 };
    if (audit) this.audits.push(audit.action);
    return Promise.resolve(this.record);
  }
  dueForReconciliation() {
    return Promise.resolve(
      this.record
        ? [{ ...this.record, appointmentStatus: this.appointmentStatus }]
        : [],
    );
  }
  clinicOrganization(clinicId: string) {
    return Promise.resolve(clinicId === 'clinic' ? 'org' : null);
  }
  account() {
    return Promise.resolve(this.accountRecord);
  }
  saveAccount(
    organizationId: string,
    write: PaymentAccountWrite,
    audit: PaymentAudit,
  ) {
    this.accountRecord = {
      organizationId,
      ...write,
      version: 1,
      updatedAt: new Date(),
    };
    this.audits.push(audit.action);
    return Promise.resolve(this.accountRecord);
  }
  onlineEnabledFlag = true;
  onlinePaymentsEnabled() {
    return Promise.resolve(this.onlineEnabledFlag);
  }
  organizationExists(id: string) {
    return Promise.resolve(id === 'org');
  }
}

class FakeGateway implements PaymentGateway {
  readonly provider = 'fib' as const;
  state: GatewayPaymentState = { status: 'unpaid', validUntil: null };
  created = 0;
  cancelled: string[] = [];
  refunded: string[] = [];
  refundError: Error | null = null;
  verifyCredentials() {
    return Promise.resolve();
  }
  create() {
    this.created += 1;
    return Promise.resolve({
      providerPaymentId: `fib-${this.created}`,
      readableCode: 'AB12-CD34',
      qrCode: 'data:image/png;base64,AAAA',
      personalAppLink: 'https://personal.example/pay',
      businessAppLink: null,
      validUntil: new Date(Date.now() + 30 * 60_000),
    });
  }
  status() {
    return Promise.resolve(this.state);
  }
  cancel(_c: unknown, id: string) {
    this.cancelled.push(id);
    return Promise.resolve();
  }
  refund(_c: unknown, id: string) {
    if (this.refundError) return Promise.reject(this.refundError);
    this.refunded.push(id);
    return Promise.resolve();
  }
}

function setup(
  options: {
    online?: boolean;
    account?: boolean;
    status?: string;
    mode?: 'platform' | 'clinic';
  } = {},
) {
  const repository = new FakeRepository();
  const gateway = new FakeGateway();
  const appt = appointment(options.status);
  const appointments = {
    get: jest.fn(() => Promise.resolve(appt)),
  } as unknown as AppointmentService;
  const configuration = {
    environment: 'development',
    paymentsOnlineEnabled: options.online ?? true,
    paymentCollectionMode: options.mode ?? 'clinic',
    paymentPlatformAccount: {
      provider: 'fib',
      environment: 'stage',
      clientId: 'saxlem-client',
      clientSecret: 'saxlem-secret',
    },
    paymentCredentialsKey: key,
    paymentLinkMinutes: 30,
    paymentWorkerPollIntervalMs: 15000,
    paymentPublicCallbackBaseUrl: 'https://api.saxlem.example',
  } as unknown as BackendConfiguration;
  if (options.account ?? true)
    repository.accountRecord = {
      organizationId: 'org',
      provider: 'fib',
      environment: 'stage',
      clientId: 'client-1234',
      clientSecretCiphertext: new CredentialCipher(key).encrypt('secret-value'),
      onlineEnabled: true,
      version: 1,
      updatedAt: new Date(),
    };
  const service = new PaymentService(
    repository,
    appointments,
    [gateway],
    configuration,
  );
  return { service, repository, gateway };
}

describe('PaymentService', () => {
  it('defaults to paying at the counter before the patient chooses', async () => {
    const { service } = setup();
    const result = await service.get(patient, 'appt', 'req');
    expect(result).toMatchObject({
      method: 'counter',
      status: 'dueAtCounter',
      amountIqd: 25000,
      onlineAvailable: true,
      version: 0,
    });
  });

  it('offers only the counter when the clinic has no account or online is off', async () => {
    expect(
      (await setup({ account: false }).service.options('clinic')).methods,
    ).toEqual(['counter']);
    expect(
      (await setup({ online: false }).service.options('clinic')).methods,
    ).toEqual(['counter']);
    expect((await setup().service.options('clinic')).methods).toEqual([
      'counter',
      'online',
    ]);
  });

  it('starts an online payment and reuses the unexpired link on retry', async () => {
    const { service, gateway, repository } = setup();
    const first = await service.choose(patient, 'appt', 'online', 'req');
    expect(first.status).toBe('pending');
    expect(first.online?.readableCode).toBe('AB12-CD34');
    const again = await service.choose(patient, 'appt', 'online', 'req');
    expect(again.online?.readableCode).toBe('AB12-CD34');
    expect(gateway.created).toBe(1);
    expect(repository.record?.callbackToken.length).toBeGreaterThanOrEqual(32);
    expect(JSON.stringify(first)).not.toContain(
      repository.record?.callbackToken,
    );
  });

  it('marks the payment paid once the provider confirms it', async () => {
    const { service, gateway } = setup();
    await service.choose(patient, 'appt', 'online', 'req');
    gateway.state = {
      status: 'paid',
      paidAt: new Date('2026-11-16T10:00:00Z'),
    };
    const result = await service.refresh(patient, 'appt', 'req');
    expect(result.status).toBe('paid');
    expect(result.paidAt).toBe('2026-11-16T10:00:00.000Z');
    expect(result.online).toBeNull();
  });

  it('cancels the online link when the patient switches to the counter', async () => {
    const { service, gateway } = setup();
    await service.choose(patient, 'appt', 'online', 'req');
    const result = await service.choose(patient, 'appt', 'counter', 'req');
    expect(result.method).toBe('counter');
    expect(gateway.cancelled).toEqual(['fib-1']);
  });

  it('refuses a second payment once paid', async () => {
    const { service, gateway } = setup();
    await service.choose(patient, 'appt', 'online', 'req');
    gateway.state = { status: 'paid', paidAt: new Date() };
    await expect(
      service.choose(patient, 'appt', 'counter', 'req'),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      service.recordCounterPayment(reception, 'appt', 'req'),
    ).rejects.toThrow('already paid in the app');
  });

  it('refuses online payment when the clinic cannot take it', async () => {
    const { service } = setup({ account: false });
    await expect(
      service.choose(patient, 'appt', 'online', 'req'),
    ).rejects.toThrow('does not accept online payment');
  });

  it('lets reception record a counter payment, safely repeated', async () => {
    const { service, repository } = setup();
    const first = await service.recordCounterPayment(reception, 'appt', 'req');
    const second = await service.recordCounterPayment(reception, 'appt', 'req');
    expect(first.status).toBe('paid');
    expect(second.version).toBe(first.version);
    expect(repository.record?.recordedByUserId).toBe('reception-user');
    expect(repository.audits).toEqual(['payment.counter_recorded']);
  });

  it('keeps roles apart', async () => {
    const { service } = setup();
    await expect(
      service.choose(reception, 'appt', 'counter', 'req'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.recordCounterPayment(patient, 'appt', 'req'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('does not take payment for cancelled appointments', async () => {
    const { service } = setup({ status: 'cancelled' });
    await expect(
      service.choose(patient, 'appt', 'online', 'req'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('refunds an online payment when the appointment is cancelled', async () => {
    const { service, gateway, repository } = setup();
    await service.choose(patient, 'appt', 'online', 'req');
    gateway.state = { status: 'paid', paidAt: new Date() };
    await service.refresh(patient, 'appt', 'req');
    repository.appointmentStatus = 'cancelled';
    await service.reconcile();
    expect(gateway.refunded).toEqual(['fib-1']);
    expect(repository.record?.status).toBe('refunded');
  });

  it('marks a refund failed when the provider rejects it', async () => {
    const { service, gateway, repository } = setup();
    await service.choose(patient, 'appt', 'online', 'req');
    gateway.state = { status: 'paid', paidAt: new Date() };
    await service.refresh(patient, 'appt', 'req');
    repository.appointmentStatus = 'cancelled';
    gateway.refundError = new PaymentGatewayError('rejected', 'window closed');
    await service.reconcile();
    expect(repository.record?.status).toBe('refundFailed');
  });

  it('voids an unpaid counter payment when the appointment is cancelled', async () => {
    const { service, repository } = setup();
    await service.choose(patient, 'appt', 'counter', 'req');
    repository.appointmentStatus = 'cancelled';
    await service.reconcile();
    expect(repository.record?.status).toBe('void');
  });

  it('expires a link the provider declined', async () => {
    const { service, gateway } = setup();
    await service.choose(patient, 'appt', 'online', 'req');
    gateway.state = { status: 'declined', reason: 'expired' };
    expect((await service.refresh(patient, 'appt', 'req')).status).toBe(
      'expired',
    );
  });

  it('ignores callbacks with unknown tokens and confirms known ones with the provider', async () => {
    const { service, gateway, repository } = setup();
    await service.handleCallback('short', 'req');
    await service.choose(patient, 'appt', 'online', 'req');
    gateway.state = { status: 'paid', paidAt: new Date() };
    await service.handleCallback('x'.repeat(40), 'req');
    expect(repository.record?.status).toBe('pending');
    await service.handleCallback(repository.record!.callbackToken, 'req');
    expect(repository.record?.status).toBe('paid');
  });

  it('collects into the Saxlem account in platform mode, per clinic opt-in', async () => {
    const { service, repository } = setup({ mode: 'platform', account: false });
    repository.onlineEnabledFlag = false;
    expect((await service.options('clinic')).methods).toEqual(['counter']);
    repository.onlineEnabledFlag = true;
    expect((await service.options('clinic')).methods).toEqual([
      'counter',
      'online',
    ]);
    await service.choose(patient, 'appt', 'online', 'req');
    expect(repository.record?.collectedBy).toBe('platform');
  });

  it('keeps refunding into the account a payment was collected by', async () => {
    const { service, gateway, repository } = setup({ mode: 'platform' });
    await service.choose(patient, 'appt', 'online', 'req');
    gateway.state = {
      status: 'paid',
      paidAt: new Date(),
      payerName: 'Avin K.',
    };
    await service.refresh(patient, 'appt', 'req');
    expect(repository.record?.payerName).toBe('Avin K.');
    repository.appointmentStatus = 'cancelled';
    await service.reconcile();
    expect(repository.record?.status).toBe('refunded');
  });

  it('stores account secrets encrypted and never returns them', async () => {
    const { service, repository } = setup({ account: false });
    const saved = await service.saveAccount(
      admin,
      'org',
      {
        provider: 'fib',
        environment: 'stage',
        clientId: 'clinic-client-9876',
        clientSecret: 'very-secret-value',
        onlineEnabled: true,
      },
      'req',
    );
    expect(saved).toMatchObject({ connected: true, clientIdHint: '…9876' });
    expect(JSON.stringify(saved)).not.toContain('very-secret-value');
    expect(repository.accountRecord?.clientSecretCiphertext).not.toContain(
      'very-secret',
    );
    expect(
      new CredentialCipher(key).decrypt(
        repository.accountRecord!.clientSecretCiphertext,
      ),
    ).toBe('very-secret-value');
  });
});
