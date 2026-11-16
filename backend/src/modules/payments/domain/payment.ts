import type { AppointmentAccess } from '../../appointments/domain/appointment';

export type PaymentMethod = 'counter' | 'online';
export type PaymentProvider = 'fib' | 'simulated';
export type PaymentCollector = 'platform' | 'organization';
export type PaymentStatus =
  | 'dueAtCounter'
  | 'pending'
  | 'paid'
  | 'expired'
  | 'cancelled'
  | 'refundPending'
  | 'refunded'
  | 'refundFailed'
  | 'void';

export type PaymentAccess = AppointmentAccess;

/** Stored state of one appointment's payment. */
export interface PaymentRecord {
  readonly id: string;
  readonly organizationId: string;
  readonly clinicId: string;
  readonly appointmentId: string;
  readonly appointmentStatus: string;
  readonly method: PaymentMethod;
  readonly provider: PaymentProvider | null;
  readonly collectedBy: PaymentCollector | null;
  readonly status: PaymentStatus;
  readonly amountIqd: number;
  readonly providerPaymentId: string | null;
  readonly payerName: string | null;
  readonly payoutId: string | null;
  readonly clawbackPayoutId: string | null;
  readonly readableCode: string | null;
  readonly qrCode: string | null;
  readonly personalAppLink: string | null;
  readonly businessAppLink: string | null;
  readonly validUntil: Date | null;
  readonly paidAt: Date | null;
  readonly recordedByUserId: string | null;
  readonly refundedAt: Date | null;
  readonly failureReason: string | null;
  readonly callbackToken: string;
  readonly lastCheckedAt: Date | null;
  readonly version: number;
}

export interface PaymentAccountRecord {
  readonly organizationId: string;
  readonly provider: PaymentProvider;
  readonly environment: string;
  readonly clientId: string;
  readonly clientSecretCiphertext: string;
  readonly onlineEnabled: boolean;
  readonly version: number;
  readonly updatedAt: Date;
}

/** What clients see. Credentials and callback tokens never leave the server. */
export interface PaymentProjection {
  readonly appointmentId: string;
  readonly method: PaymentMethod;
  readonly status: PaymentStatus;
  readonly amountIqd: number;
  readonly currency: 'IQD';
  readonly provider: PaymentProvider | null;
  readonly onlineAvailable: boolean;
  readonly online: {
    readonly readableCode: string | null;
    readonly qrCode: string | null;
    readonly personalAppLink: string | null;
    readonly businessAppLink: string | null;
    readonly validUntil: string | null;
  } | null;
  readonly paidAt: string | null;
  readonly refundedAt: string | null;
  readonly version: number;
}

export const settledStatuses: ReadonlySet<PaymentStatus> = new Set([
  'paid',
  'refundPending',
  'refunded',
  'refundFailed',
]);

export const bookableAppointmentStatuses: ReadonlySet<string> = new Set([
  'scheduled',
  'confirmed',
]);

/** A pending online link the patient can still use. */
export function isUsableLink(record: PaymentRecord, now: Date): boolean {
  return (
    record.method === 'online' &&
    record.status === 'pending' &&
    record.validUntil !== null &&
    record.validUntil.getTime() - now.getTime() > 60_000
  );
}

/** Builds the projection; a missing record means "pay at the counter". */
export function projectPayment(input: {
  appointmentId: string;
  feeIqd: number;
  record: PaymentRecord | null;
  onlineAvailable: boolean;
}): PaymentProjection {
  const { record } = input;
  if (!record)
    return Object.freeze({
      appointmentId: input.appointmentId,
      method: 'counter',
      status: 'dueAtCounter',
      amountIqd: input.feeIqd,
      currency: 'IQD',
      provider: null,
      onlineAvailable: input.onlineAvailable,
      online: null,
      paidAt: null,
      refundedAt: null,
      version: 0,
    });
  return Object.freeze({
    appointmentId: record.appointmentId,
    method: record.method,
    status: record.status,
    amountIqd: record.amountIqd,
    currency: 'IQD',
    provider: record.provider,
    onlineAvailable: input.onlineAvailable,
    online:
      record.method === 'online' && record.status === 'pending'
        ? Object.freeze({
            readableCode: record.readableCode,
            qrCode: record.qrCode,
            personalAppLink: record.personalAppLink,
            businessAppLink: record.businessAppLink,
            validUntil: record.validUntil?.toISOString() ?? null,
          })
        : null,
    paidAt: record.paidAt?.toISOString() ?? null,
    refundedAt: record.refundedAt?.toISOString() ?? null,
    version: record.version,
  });
}
