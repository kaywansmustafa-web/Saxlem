import type {
  PaymentCollector,
  PaymentProvider,
  PaymentStatus,
} from './payment';

/** One online or counter payment as the Owner Portal ledger shows it. */
export interface LedgerEntry {
  readonly id: string;
  readonly appointmentId: string;
  readonly appointmentReference: string;
  readonly organizationId: string;
  readonly organizationName: string;
  readonly clinicId: string;
  readonly clinicName: string;
  readonly doctorId: string;
  readonly doctorName: string;
  readonly patientName: string;
  readonly bookedAt: Date;
  readonly appointmentStartsAt: Date;
  readonly method: 'counter' | 'online';
  readonly amountIqd: number;
  readonly status: PaymentStatus;
  readonly collectedBy: PaymentCollector | null;
  readonly provider: PaymentProvider | null;
  readonly payerName: string | null;
  readonly paidAt: Date | null;
  readonly refundedAt: Date | null;
  readonly payoutId: string | null;
}

export interface LedgerFilter {
  readonly from: Date;
  readonly to: Date;
  readonly organizationId?: string | undefined;
  readonly method?: 'counter' | 'online' | undefined;
  readonly cursor?: string | undefined;
  readonly pageSize: number;
}

export interface DoctorPayoutProfile {
  readonly organizationId: string;
  readonly doctorId: string;
  readonly payoutAccountName: string | null;
  readonly payoutAccountNumber: string | null;
  readonly version: number;
}

/** A doctor Saxlem may owe money to (or collect commission from). */
export interface Payee {
  readonly organizationId: string;
  readonly organizationName: string;
  readonly doctorId: string;
  readonly doctorName: string;
}

export interface PayoutProfile {
  readonly organizationId: string;
  readonly onlinePaymentsEnabled: boolean;
  readonly payoutAccountName: string | null;
  readonly payoutAccountNumber: string | null;
  readonly version: number;
}

/** Baghdad has no daylight saving: a month starts at 00:00 UTC+03:00. */
export function baghdadMonth(month: string): { start: Date; end: Date } {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month);
  if (!match) throw new Error('Month must look like 2026-11.');
  const year = Number(match[1]),
    index = Number(match[2]) - 1;
  const start = new Date(Date.UTC(year, index, 1, -3));
  const end = new Date(Date.UTC(year, index + 1, 1, -3));
  return { start, end };
}

export interface PayoutRepository {
  ledger(filter: LedgerFilter): Promise<{
    items: readonly LedgerEntry[];
    nextCursor: string | null;
  }>;
  organizations(): Promise<readonly { id: string; name: string }[]>;
  payee(organizationId: string, doctorId: string): Promise<Payee | null>;
  profile(organizationId: string): Promise<PayoutProfile | null>;
  saveProfile(
    organizationId: string,
    input: {
      onlinePaymentsEnabled: boolean;
      payoutAccountName: string | null;
      payoutAccountNumber: string | null;
    },
    actorUserId: string,
    requestId: string,
  ): Promise<PayoutProfile>;
  doctorProfile(
    organizationId: string,
    doctorId: string,
  ): Promise<DoctorPayoutProfile | null>;
  saveDoctorProfile(
    organizationId: string,
    doctorId: string,
    input: {
      payoutAccountName: string | null;
      payoutAccountNumber: string | null;
    },
    actorUserId: string,
    requestId: string,
  ): Promise<DoctorPayoutProfile>;
}

export const PAYOUT_REPOSITORY = Symbol('PAYOUT_REPOSITORY');
