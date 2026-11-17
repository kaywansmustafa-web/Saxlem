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

export interface PayoutPayment {
  readonly id: string;
  readonly amountIqd: number;
  readonly doctorId: string;
  readonly doctorName: string;
}

/** Everything a month's settlement with one doctor is built from. Each
 * doctor is billed and paid separately. */
export interface PayoutInputs {
  readonly organizationId: string;
  readonly organizationName: string;
  readonly doctorId: string;
  readonly doctorName: string;
  readonly payments: readonly PayoutPayment[];
  readonly clawbacks: readonly PayoutPayment[];
  readonly commissionIqd: number;
  readonly settled: SettledPayout | null;
  /** Payments a settled payout covered, for its doctor breakdown. */
  readonly settledPayments: readonly PayoutPayment[];
  /** Organization switch for online payments. */
  readonly profile: PayoutProfile | null;
  /** Where this doctor's money goes. */
  readonly doctorProfile: DoctorPayoutProfile | null;
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

export interface SettledPayout {
  readonly id: string;
  readonly grossCollectedIqd: number;
  readonly clawbackIqd: number;
  readonly providerFeeIqd: number;
  readonly commissionIqd: number;
  readonly netPayableIqd: number;
  readonly paymentCount: number;
  readonly reference: string;
  readonly note: string | null;
  readonly settledAt: Date;
}

export interface PayoutProfile {
  readonly organizationId: string;
  readonly onlinePaymentsEnabled: boolean;
  readonly payoutAccountName: string | null;
  readonly payoutAccountNumber: string | null;
  readonly version: number;
}

export interface PayoutTotals {
  readonly grossCollectedIqd: number;
  readonly clawbackIqd: number;
  readonly providerFeeIqd: number;
  readonly commissionIqd: number;
  readonly netPayableIqd: number;
  readonly paymentCount: number;
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

export function payoutTotals(
  inputs: Pick<PayoutInputs, 'payments' | 'clawbacks' | 'commissionIqd'>,
  feeBps: number,
  feePassedToClinic: boolean,
): PayoutTotals {
  const gross = inputs.payments.reduce((sum, p) => sum + p.amountIqd, 0);
  const clawback = inputs.clawbacks.reduce((sum, p) => sum + p.amountIqd, 0);
  const fee = feePassedToClinic ? Math.round((gross * feeBps) / 10_000) : 0;
  return Object.freeze({
    grossCollectedIqd: gross,
    clawbackIqd: clawback,
    providerFeeIqd: fee,
    commissionIqd: inputs.commissionIqd,
    netPayableIqd: gross - clawback - fee - inputs.commissionIqd,
    paymentCount: inputs.payments.length,
  });
}

export function doctorBreakdown(payments: readonly PayoutPayment[]) {
  const byDoctor = new Map<
    string,
    {
      doctorId: string;
      doctorName: string;
      paymentCount: number;
      grossIqd: number;
    }
  >();
  for (const p of payments) {
    const row = byDoctor.get(p.doctorId) ?? {
      doctorId: p.doctorId,
      doctorName: p.doctorName,
      paymentCount: 0,
      grossIqd: 0,
    };
    row.paymentCount += 1;
    row.grossIqd += p.amountIqd;
    byDoctor.set(p.doctorId, row);
  }
  return [...byDoctor.values()].sort((a, b) => b.grossIqd - a.grossIqd);
}

export interface PayoutRepository {
  ledger(filter: LedgerFilter): Promise<{
    items: readonly LedgerEntry[];
    nextCursor: string | null;
  }>;
  organizations(): Promise<readonly { id: string; name: string }[]>;
  /** Active doctors, plus any doctor with money in the month. */
  payees(start: Date, end: Date): Promise<readonly Payee[]>;
  payee(organizationId: string, doctorId: string): Promise<Payee | null>;
  inputs(
    organizationId: string,
    doctorId: string,
    start: Date,
    end: Date,
  ): Promise<PayoutInputs>;
  /** Re-reads the inputs under lock and records the payout only if they are
   * unchanged. Returns null when something changed or it was already settled. */
  settle(input: {
    organizationId: string;
    doctorId: string;
    start: Date;
    end: Date;
    expected: PayoutTotals;
    feeBps: number;
    feePassedToClinic: boolean;
    reference: string;
    note: string | null;
    actorUserId: string;
    requestId: string;
  }): Promise<SettledPayout | null>;
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
