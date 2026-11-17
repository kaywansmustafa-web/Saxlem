/**
 * A statement is everything between Saxlem and one doctor for one 30-day
 * billing cycle: commission on app bookings, money Saxlem collected in the
 * app for the doctor, and the settlement that closes it. Saxlem pays the
 * doctor (FIB or cash) when the app money is larger; otherwise the doctor
 * pays Saxlem the difference in cash.
 */
export type SettlementMethod = 'fib' | 'cash';
/** carried: the doctor owed, did not pay, and the balance moved into the
 * next statement (taken from their app payments there). */
export type ClosingMethod = SettlementMethod | 'carried';

export interface StatementSettlement {
  readonly id: string;
  readonly cycleNumber: number | null;
  readonly periodStart: Date;
  readonly periodEnd: Date;
  /** Earliest time this settlement swept up. */
  readonly windowStart: Date;
  readonly method: ClosingMethod;
  /** For a carried statement: the cycle its balance moved into. */
  readonly carriedIntoCycle: number | null;
  /** Unpaid balance brought in from earlier statements (zero or less). */
  readonly carriedInIqd: number;
  readonly reference: string | null;
  readonly counterpartyName: string | null;
  readonly note: string | null;
  readonly settledAt: Date;
  /** Null when Saxlem closed it automatically (carried). */
  readonly settledByName: string | null;
  readonly grossCollectedIqd: number;
  readonly clawbackIqd: number;
  readonly providerFeeIqd: number;
  readonly commissionIqd: number;
  readonly netPayableIqd: number;
  readonly paymentCount: number;
}

export interface StatementDoctor {
  readonly organizationId: string;
  readonly organizationName: string;
  readonly doctorId: string;
  readonly doctorName: string;
  /** YYYY-MM-DD the cycles count from. */
  readonly cycleStart: string;
  readonly clinicNames: readonly string[];
  readonly settlements: readonly StatementSettlement[];
  /** Hidden from the patient app for an overdue balance. */
  readonly appHiddenAt: Date | null;
  /** Saxlem gave more time: no hiding before this. */
  readonly billingGraceUntil: Date | null;
  readonly payoutAccount: {
    readonly name: string | null;
    readonly number: string | null;
  } | null;
}

/** Times of everything not yet settled, to find the next statement due. */
export interface StatementActivity {
  /** Charges (and credits) not covered by a settlement. */
  readonly charges: readonly Date[];
  /** In-app payments not yet paid out. */
  readonly payments: readonly Date[];
  /** Refunds of paid-out payments not yet taken back. */
  readonly clawbacks: readonly Date[];
}

export interface StatementCharge {
  readonly id: string;
  readonly recognizedAt: Date;
  readonly appointmentReference: string;
  readonly appointmentStartsAt: Date;
  readonly clinicName: string;
  readonly planName: string;
  readonly amountIqd: number;
  readonly status: 'earned' | 'reversed';
  readonly reason: string | null;
  readonly originalId: string | null;
}

export interface StatementMoney {
  readonly id: string;
  readonly at: Date;
  readonly appointmentReference: string;
  readonly amountIqd: number;
}

export interface StatementLines {
  readonly charges: readonly StatementCharge[];
  readonly payments: readonly StatementMoney[];
  readonly clawbacks: readonly StatementMoney[];
}

export interface StatementFacts {
  readonly visits: {
    readonly total: number;
    readonly completed: number;
    readonly noShow: number;
    readonly cancelled: number;
    readonly upcoming: number;
    readonly app: number;
    readonly phone: number;
    readonly walkIn: number;
  };
  readonly revenue: {
    readonly counterIqd: number;
    readonly counterCount: number;
    readonly onlineIqd: number;
    readonly onlineCount: number;
  };
}

export interface StatementWindow {
  /** Charges from here (exclusive of anything already settled). */
  readonly chargesFrom: Date;
  /** Payments from here (only those not yet paid out). */
  readonly paymentsFrom: Date;
  readonly to: Date;
}

export interface StatementRepository {
  doctor(
    organizationId: string,
    doctorId: string,
  ): Promise<StatementDoctor | null>;
  /** Doctors Saxlem bills: working ones and any with charges or payments. */
  doctors(organizationId?: string): Promise<readonly StatementDoctor[]>;
  activity(doctor: StatementDoctor): Promise<StatementActivity>;
  /** Lines of an unsettled statement. */
  openLines(
    doctor: StatementDoctor,
    window: StatementWindow,
  ): Promise<StatementLines>;
  /** Lines a settlement covered. */
  settledLines(
    doctor: StatementDoctor,
    settlement: StatementSettlement,
  ): Promise<StatementLines>;
  facts(doctor: StatementDoctor, from: Date, to: Date): Promise<StatementFacts>;
  /** Re-reads the lines under a lock and records the settlement only if the
   * totals still match. Returns null when anything changed. */
  settle(input: {
    doctor: StatementDoctor;
    cycleNumber: number;
    periodStart: Date;
    periodEnd: Date;
    window: StatementWindow;
    expectedNetPayableIqd: number;
    totals: (
      lines: StatementLines,
      settlements: readonly StatementSettlement[],
    ) => {
      grossCollectedIqd: number;
      clawbackIqd: number;
      providerFeeIqd: number;
      commissionIqd: number;
      carriedInIqd: number;
      netPayableIqd: number;
      paymentCount: number;
    };
    method: ClosingMethod;
    carriedIntoCycle: number | null;
    reference: string | null;
    counterpartyName: string | null;
    note: string | null;
    actorUserId: string | null;
    requestId: string;
  }): Promise<StatementSettlement | null>;
  /** Hides the doctor from the patient app, or shows them again. */
  setAppHidden(
    doctor: StatementDoctor,
    hidden: boolean,
    actorUserId: string | null,
    requestId: string,
  ): Promise<void>;
  setGrace(
    doctor: StatementDoctor,
    until: Date,
    actorUserId: string,
    requestId: string,
  ): Promise<void>;
}

export const STATEMENT_REPOSITORY = Symbol('STATEMENT_REPOSITORY');
