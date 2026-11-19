import type {
  PaymentCollector,
  PaymentAccess,
  PaymentAccountRecord,
  PaymentMethod,
  PaymentProvider,
  PaymentRecord,
  PaymentStatus,
} from './payment';

export interface PaymentWrite {
  readonly method: PaymentMethod;
  readonly provider: PaymentProvider | null;
  readonly collectedBy: PaymentCollector | null;
  readonly status: PaymentStatus;
  readonly amountIqd: number;
  readonly providerPaymentId: string | null;
  readonly readableCode: string | null;
  readonly qrCode: string | null;
  readonly personalAppLink: string | null;
  readonly businessAppLink: string | null;
  readonly validUntil: Date | null;
  readonly paidAt: Date | null;
  readonly recordedByUserId: string | null;
  readonly failureReason: string | null;
}

export interface PaymentPatch {
  readonly status?: PaymentStatus;
  readonly paidAt?: Date | null;
  readonly refundedAt?: Date | null;
  readonly failureReason?: string | null;
  readonly validUntil?: Date | null;
  readonly lastCheckedAt?: Date;
  readonly payerName?: string | null;
}

export interface PaymentAudit {
  readonly actorUserId: string | null;
  readonly action: string;
  readonly requestId: string;
  readonly metadata?: Record<string, string | number | boolean | null>;
}

export interface PaymentAccountWrite {
  readonly provider: PaymentProvider;
  readonly environment: string;
  readonly clientId: string;
  readonly clientSecretCiphertext: string;
  readonly onlineEnabled: boolean;
}

export interface PaymentRepository {
  findByAppointment(appointmentId: string): Promise<PaymentRecord | null>;
  findByCallbackToken(token: string): Promise<PaymentRecord | null>;
  listForAppointments(
    access: PaymentAccess,
    appointmentIds: readonly string[],
  ): Promise<readonly PaymentRecord[]>;
  /** Creates or replaces the appointment's payment. `expectedVersion` 0 means
   * no record may exist yet. Returns null when another writer won. */
  save(
    appointment: {
      readonly id: string;
      readonly organizationId: string;
      readonly clinicId: string;
    },
    expectedVersion: number,
    write: PaymentWrite,
    callbackToken: string,
    audit: PaymentAudit,
  ): Promise<PaymentRecord | null>;
  patch(
    record: PaymentRecord,
    patch: PaymentPatch,
    audit?: PaymentAudit,
  ): Promise<PaymentRecord | null>;
  dueForReconciliation(
    checkedBefore: Date,
    limit: number,
  ): Promise<readonly PaymentRecord[]>;
  clinicOrganization(clinicId: string): Promise<string | null>;
  account(organizationId: string): Promise<PaymentAccountRecord | null>;
  saveAccount(
    organizationId: string,
    write: PaymentAccountWrite,
    audit: PaymentAudit,
  ): Promise<PaymentAccountRecord>;
  organizationExists(organizationId: string): Promise<boolean>;
  onlinePaymentsEnabled(organizationId: string): Promise<boolean>;
}

export const PAYMENT_REPOSITORY = Symbol('PAYMENT_REPOSITORY');
