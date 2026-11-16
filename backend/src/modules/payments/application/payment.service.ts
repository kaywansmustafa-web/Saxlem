import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { BACKEND_CONFIGURATION } from '../../../config/configuration.module';
import type { BackendConfiguration } from '../../../config/environment';
import { AppointmentService } from '../../appointments/application/appointment.service';
import type { AppointmentProjection } from '../../appointments/domain/appointment';
import {
  bookableAppointmentStatuses,
  isUsableLink,
  projectPayment,
  settledStatuses,
  type PaymentAccess,
  type PaymentAccountRecord,
  type PaymentMethod,
  type PaymentProvider,
  type PaymentRecord,
} from '../domain/payment';
import {
  PAYMENT_GATEWAYS,
  PaymentGatewayError,
  type GatewayCredentials,
  type GatewayPaymentState,
  type PaymentGateway,
} from '../domain/payment-gateway';
import {
  PAYMENT_REPOSITORY,
  type PaymentRepository,
  type PaymentWrite,
} from '../domain/payment.repository';
import { CredentialCipher } from '../infrastructure/credential-cipher';

export interface PaymentAccountInput {
  readonly provider: PaymentProvider;
  readonly environment: string;
  readonly clientId: string;
  readonly clientSecret: string;
  readonly onlineEnabled: boolean;
}

/** Appointment payments: pay at the clinic counter, or pay online into the
 * clinic organization's own merchant account. Saxlem never holds the money. */
@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly cipher: CredentialCipher | null;

  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly repository: PaymentRepository,
    private readonly appointments: AppointmentService,
    @Inject(PAYMENT_GATEWAYS)
    private readonly gateways: readonly PaymentGateway[],
    @Inject(BACKEND_CONFIGURATION)
    private readonly configuration: BackendConfiguration,
  ) {
    this.cipher = configuration.paymentCredentialsKey
      ? new CredentialCipher(configuration.paymentCredentialsKey)
      : null;
  }

  /** Which payment methods a clinic accepts; shown before booking. */
  async options(clinicId: string) {
    const organizationId = await this.repository.clinicOrganization(clinicId);
    if (!organizationId) throw new NotFoundException('Clinic was not found.');
    const account = await this.usableAccount(organizationId);
    return Object.freeze({
      clinicId,
      methods: account
        ? (['counter', 'online'] as const)
        : (['counter'] as const),
      onlineProvider: account?.provider ?? null,
      currency: 'IQD' as const,
    });
  }

  async get(access: PaymentAccess, appointmentId: string, requestId: string) {
    const appointment = await this.appointments.get(
      access,
      appointmentId,
      requestId,
    );
    let record = await this.repository.findByAppointment(appointment.id);
    if (record && record.status === 'pending' && this.checkIsStale(record))
      record = await this.syncQuietly(record, requestId);
    return this.project(appointment, record);
  }

  async choose(
    access: PaymentAccess,
    appointmentId: string,
    method: PaymentMethod,
    requestId: string,
    now = new Date(),
  ) {
    if (!access.patient)
      throw new ForbiddenException('Only the patient chooses how to pay.');
    const appointment = await this.appointments.get(
      access,
      appointmentId,
      requestId,
    );
    if (!bookableAppointmentStatuses.has(appointment.status))
      throw new ConflictException(
        'This appointment can no longer be paid for.',
      );
    let record = await this.repository.findByAppointment(appointment.id);
    if (record?.status === 'pending')
      record = await this.sync(record, requestId);
    if (record && settledStatuses.has(record.status))
      throw new ConflictException('This appointment is already paid.');

    if (method === 'counter') {
      if (record?.method === 'counter' && record.status === 'dueAtCounter')
        return this.project(appointment, record);
      if (record?.status === 'pending') await this.closeAtProvider(record);
      const saved = await this.save(
        appointment,
        record,
        this.counterWrite(appointment),
        {
          actorUserId: access.actorId,
          action: 'payment.method_chosen',
          requestId,
        },
      );
      return this.project(appointment, saved);
    }

    if (record && isUsableLink(record, now))
      return this.project(appointment, record);
    const account = await this.usableAccount(appointment.organizationId);
    if (!account)
      throw new ConflictException(
        'This clinic does not accept online payment yet.',
      );
    if (record?.status === 'pending') await this.closeAtProvider(record);
    const callbackToken = randomBytes(24).toString('base64url');
    const credentials = this.credentials(account);
    const created = await this.gatewayCall(() =>
      this.gateway(account.provider).create(credentials, {
        amountIqd: appointment.feeIqd,
        description: `Saxlem ${appointment.reference}`,
        expiresInMinutes: this.configuration.paymentLinkMinutes,
        statusCallbackUrl: this.callbackUrl(account.provider, callbackToken),
      }),
    );
    const saved = await this.repository.save(
      appointment,
      record?.version ?? 0,
      {
        method: 'online',
        provider: account.provider,
        status: 'pending',
        amountIqd: appointment.feeIqd,
        providerPaymentId: created.providerPaymentId,
        readableCode: created.readableCode,
        qrCode: created.qrCode,
        personalAppLink: created.personalAppLink,
        businessAppLink: created.businessAppLink,
        validUntil: created.validUntil,
        paidAt: null,
        recordedByUserId: null,
        failureReason: null,
      },
      callbackToken,
      {
        actorUserId: access.actorId,
        action: 'payment.online_started',
        requestId,
      },
    );
    if (!saved) {
      await this.gateway(account.provider)
        .cancel(credentials, created.providerPaymentId)
        .catch(() => undefined);
      throw new ConflictException('The payment changed. Please try again.');
    }
    return this.project(appointment, saved);
  }

  /** Re-checks an online payment with the provider (the app polls this). */
  async refresh(
    access: PaymentAccess,
    appointmentId: string,
    requestId: string,
  ) {
    const appointment = await this.appointments.get(
      access,
      appointmentId,
      requestId,
    );
    let record = await this.repository.findByAppointment(appointment.id);
    if (record?.status === 'pending' || record?.status === 'refundPending')
      record = await this.sync(record, requestId);
    return this.project(appointment, record);
  }

  /** Reception records that the patient paid in person. */
  async recordCounterPayment(
    access: PaymentAccess,
    appointmentId: string,
    requestId: string,
    now = new Date(),
  ) {
    if (access.patient || access.doctor)
      throw new ForbiddenException(
        'Only clinic staff record counter payments.',
      );
    const appointment = await this.appointments.get(
      access,
      appointmentId,
      requestId,
    );
    if (!['scheduled', 'confirmed', 'completed'].includes(appointment.status))
      throw new ConflictException(
        'This appointment can no longer be paid for.',
      );
    let record = await this.repository.findByAppointment(appointment.id);
    if (record?.status === 'pending')
      record = await this.sync(record, requestId);
    if (record && settledStatuses.has(record.status)) {
      if (record.method === 'counter') return this.project(appointment, record);
      throw new ConflictException('The patient already paid in the app.');
    }
    if (record?.status === 'pending') await this.closeAtProvider(record);
    const saved = await this.save(
      appointment,
      record,
      {
        ...this.counterWrite(appointment),
        status: 'paid',
        paidAt: now,
        recordedByUserId: access.actorId,
      },
      {
        actorUserId: access.actorId,
        action: 'payment.counter_recorded',
        requestId,
      },
    );
    return this.project(appointment, saved);
  }

  async listForAppointments(
    access: PaymentAccess,
    appointmentIds: readonly string[],
  ) {
    if (access.patient || access.doctor)
      throw new ForbiddenException('Clinic staff access is required.');
    const records = await this.repository.listForAppointments(
      access,
      appointmentIds,
    );
    return records.map((record) =>
      projectPayment({
        appointmentId: record.appointmentId,
        feeIqd: record.amountIqd,
        record,
        onlineAvailable: false,
      }),
    );
  }

  /** FIB callbacks are unsigned: the body is ignored and the status is always
   * confirmed with the provider. Unknown tokens are ignored silently. */
  async handleCallback(callbackToken: string, requestId: string) {
    if (!/^[A-Za-z0-9_-]{32,64}$/.test(callbackToken)) return;
    const record = await this.repository.findByCallbackToken(callbackToken);
    if (record?.status === 'pending') await this.syncQuietly(record, requestId);
  }

  /** One worker pass: confirm pending payments, close links and refund
   * payments for cancelled appointments. */
  async reconcile(limit = 50, now = new Date()) {
    const due = await this.repository.dueForReconciliation(
      new Date(now.getTime() - this.configuration.paymentWorkerPollIntervalMs),
      limit,
    );
    let handled = 0;
    for (const record of due) {
      try {
        await this.reconcileOne(record, now);
        handled += 1;
      } catch (error) {
        this.logger.warn(
          `Payment ${record.id} reconciliation deferred: ${error instanceof Error ? error.message : 'unknown error'}`,
        );
      }
    }
    return handled;
  }

  async account(organizationId: string) {
    if (!(await this.repository.organizationExists(organizationId)))
      throw new NotFoundException('Organization was not found.');
    return this.accountProjection(
      organizationId,
      await this.repository.account(organizationId),
    );
  }

  async saveAccount(
    access: PaymentAccess,
    organizationId: string,
    input: PaymentAccountInput,
    requestId: string,
  ) {
    if (!access.platformAdministrator)
      throw new ForbiddenException(
        'Platform administrator access is required.',
      );
    if (!this.cipher)
      throw new ServiceUnavailableException(
        'Payment credential encryption is not configured.',
      );
    if (!(await this.repository.organizationExists(organizationId)))
      throw new NotFoundException('Organization was not found.');
    if (
      input.provider === 'simulated' &&
      this.configuration.environment === 'production'
    )
      throw new BadRequestException(
        'The simulated provider is not allowed in production.',
      );
    const environment =
      input.provider === 'simulated' ? 'simulated' : input.environment;
    if (input.provider === 'fib' && !['stage', 'prod'].includes(environment))
      throw new BadRequestException('FIB environment must be stage or prod.');
    const credentials: GatewayCredentials = {
      provider: input.provider,
      environment,
      clientId: input.clientId.trim(),
      clientSecret: input.clientSecret,
    };
    await this.gatewayCall(() =>
      this.gateway(input.provider).verifyCredentials(credentials),
    );
    const saved = await this.repository.saveAccount(
      organizationId,
      {
        provider: input.provider,
        environment,
        clientId: credentials.clientId,
        clientSecretCiphertext: this.cipher.encrypt(input.clientSecret),
        onlineEnabled: input.onlineEnabled,
      },
      {
        actorUserId: access.actorId,
        action: 'payment.account_updated',
        requestId,
        metadata: {
          provider: input.provider,
          environment,
          onlineEnabled: input.onlineEnabled,
        },
      },
    );
    return this.accountProjection(organizationId, saved);
  }

  private async reconcileOne(record: PaymentRecord, now: Date) {
    const requestId = `payment-worker:${now.toISOString()}`;
    let current: PaymentRecord | null = record;
    if (current.status === 'pending')
      current = await this.sync(current, requestId);
    if (!current || current.appointmentStatus !== 'cancelled') return;
    if (current.status === 'pending') {
      await this.closeAtProvider(current);
      await this.repository.patch(
        current,
        { status: 'cancelled', lastCheckedAt: now },
        {
          actorUserId: null,
          action: 'payment.cancelled_with_appointment',
          requestId,
        },
      );
    } else if (current.status === 'dueAtCounter') {
      await this.repository.patch(
        current,
        { status: 'void' },
        {
          actorUserId: null,
          action: 'payment.voided_with_appointment',
          requestId,
        },
      );
    } else if (
      current.method === 'online' &&
      (current.status === 'paid' || current.status === 'refundPending')
    ) {
      await this.refund(current, now, requestId);
    }
  }

  private async refund(record: PaymentRecord, now: Date, requestId: string) {
    const account = await this.repository.account(record.organizationId);
    if (!account || !record.provider || !record.providerPaymentId) {
      await this.repository.patch(record, {
        status: 'refundFailed',
        failureReason: 'accountMissing',
      });
      return;
    }
    try {
      await this.gateway(record.provider).refund(
        this.credentials(account),
        record.providerPaymentId,
      );
      await this.repository.patch(
        record,
        { status: 'refunded', refundedAt: now },
        {
          actorUserId: null,
          action: 'payment.refunded',
          requestId,
        },
      );
    } catch (error) {
      if (
        error instanceof PaymentGatewayError &&
        error.kind === 'unavailable'
      ) {
        if (record.status !== 'refundPending')
          await this.repository.patch(record, { status: 'refundPending' });
        throw error;
      }
      // Rejected: usually the refund window has closed. The clinic refunds by hand.
      await this.repository.patch(
        record,
        { status: 'refundFailed', failureReason: 'providerRejected' },
        { actorUserId: null, action: 'payment.refund_failed', requestId },
      );
    }
  }

  private async sync(
    record: PaymentRecord,
    requestId: string,
  ): Promise<PaymentRecord> {
    if (!record.provider || !record.providerPaymentId) return record;
    const account = await this.repository.account(record.organizationId);
    if (!account) return record;
    const state = await this.gatewayCall(() =>
      this.gateway(record.provider as PaymentProvider).status(
        this.credentials(account),
        record.providerPaymentId as string,
      ),
    );
    const patched = await this.apply(record, state, requestId);
    return (
      patched ??
      (await this.repository.findByAppointment(record.appointmentId)) ??
      record
    );
  }

  private async syncQuietly(record: PaymentRecord, requestId: string) {
    try {
      return await this.sync(record, requestId);
    } catch {
      return record;
    }
  }

  private apply(
    record: PaymentRecord,
    state: GatewayPaymentState,
    requestId: string,
  ) {
    const now = new Date();
    if (state.status === 'paid')
      return this.repository.patch(
        record,
        { status: 'paid', paidAt: state.paidAt, lastCheckedAt: now },
        { actorUserId: null, action: 'payment.online_paid', requestId },
      );
    if (state.status === 'declined')
      return this.repository.patch(record, {
        status: state.reason === 'cancelled' ? 'cancelled' : 'expired',
        failureReason: state.reason,
        lastCheckedAt: now,
      });
    if (record.validUntil && record.validUntil <= now)
      return this.repository.patch(record, {
        status: 'expired',
        failureReason: 'expired',
        lastCheckedAt: now,
      });
    return this.repository.patch(record, { lastCheckedAt: now });
  }

  private async closeAtProvider(record: PaymentRecord) {
    if (!record.provider || !record.providerPaymentId) return;
    const account = await this.repository.account(record.organizationId);
    if (!account) return;
    await this.gatewayCall(() =>
      this.gateway(record.provider as PaymentProvider).cancel(
        this.credentials(account),
        record.providerPaymentId as string,
      ),
    ).catch((error: unknown) => {
      // An expired or already-closed link cannot be cancelled; that is fine.
      if (error instanceof ConflictException) return;
      throw error;
    });
  }

  private async save(
    appointment: AppointmentProjection,
    record: PaymentRecord | null,
    write: PaymentWrite,
    audit: { actorUserId: string; action: string; requestId: string },
  ) {
    const saved = await this.repository.save(
      appointment,
      record?.version ?? 0,
      write,
      record?.callbackToken ?? randomBytes(24).toString('base64url'),
      audit,
    );
    if (!saved)
      throw new ConflictException('The payment changed. Please try again.');
    return saved;
  }

  private counterWrite(appointment: AppointmentProjection): PaymentWrite {
    return {
      method: 'counter',
      provider: null,
      status: 'dueAtCounter',
      amountIqd: appointment.feeIqd,
      providerPaymentId: null,
      readableCode: null,
      qrCode: null,
      personalAppLink: null,
      businessAppLink: null,
      validUntil: null,
      paidAt: null,
      recordedByUserId: null,
      failureReason: null,
    };
  }

  private async project(
    appointment: AppointmentProjection,
    record: PaymentRecord | null,
  ) {
    const online =
      bookableAppointmentStatuses.has(appointment.status) &&
      (await this.usableAccount(appointment.organizationId)) !== null;
    return projectPayment({
      appointmentId: appointment.id,
      feeIqd: appointment.feeIqd,
      record,
      onlineAvailable: online,
    });
  }

  private async usableAccount(organizationId: string) {
    if (!this.configuration.paymentsOnlineEnabled || !this.cipher) return null;
    const account = await this.repository.account(organizationId);
    if (!account?.onlineEnabled) return null;
    if (
      account.provider === 'simulated' &&
      this.configuration.environment === 'production'
    )
      return null;
    return account;
  }

  private credentials(account: PaymentAccountRecord): GatewayCredentials {
    if (!this.cipher)
      throw new ServiceUnavailableException(
        'Online payments are not configured.',
      );
    return {
      provider: account.provider,
      environment: account.environment,
      clientId: account.clientId,
      clientSecret: this.cipher.decrypt(account.clientSecretCiphertext),
    };
  }

  private gateway(provider: PaymentProvider) {
    const gateway = this.gateways.find((item) => item.provider === provider);
    if (!gateway)
      throw new ServiceUnavailableException('Payment provider is unavailable.');
    return gateway;
  }

  private callbackUrl(provider: PaymentProvider, token: string) {
    const base = this.configuration.paymentPublicCallbackBaseUrl;
    if (!base || provider !== 'fib') return undefined;
    return `${base.replace(/\/+$/, '')}/api/v1/payments/fib/callback/${token}`;
  }

  private checkIsStale(record: PaymentRecord) {
    return (
      !record.lastCheckedAt ||
      Date.now() - record.lastCheckedAt.getTime() > 5_000
    );
  }

  private async gatewayCall<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (!(error instanceof PaymentGatewayError)) throw error;
      if (error.kind === 'credentials')
        throw new BadRequestException(
          'The payment provider rejected the clinic credentials.',
        );
      if (error.kind === 'rejected')
        throw new ConflictException(
          'The payment provider declined the request.',
        );
      throw new ServiceUnavailableException(
        'The payment provider is not responding. Please try again.',
      );
    }
  }

  private accountProjection(
    organizationId: string,
    account: PaymentAccountRecord | null,
  ) {
    return Object.freeze({
      organizationId,
      connected: account !== null,
      provider: account?.provider ?? null,
      environment: account?.environment ?? null,
      clientIdHint: account ? `…${account.clientId.slice(-4)}` : null,
      onlineEnabled: account?.onlineEnabled ?? false,
      platformOnlineEnabled: this.configuration.paymentsOnlineEnabled,
      updatedAt: account?.updatedAt.toISOString() ?? null,
    });
  }
}
