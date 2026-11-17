import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BACKEND_CONFIGURATION } from '../../../config/configuration.module';
import type { BackendConfiguration } from '../../../config/environment';
import {
  cycleAt,
  cycleByNumber,
  cycleQueryStart,
  statementNumber,
  type BillingCycle,
} from '../../../common/billing/billing-cycle';
import {
  STATEMENT_REPOSITORY,
  type SettlementMethod,
  type StatementDoctor,
  type StatementLines,
  type StatementRepository,
  type StatementSettlement,
  type StatementWindow,
} from '../domain/statement';

/** Who is asking: Saxlem, or clinic staff limited to some doctors. */
export interface StatementAccess {
  readonly actorId: string;
  readonly platformAdministrator: boolean;
  readonly organizationId?: string;
  /** Receptionists' doctors, or a doctor's own id. */
  readonly doctorIds?: readonly string[];
}

type Status = 'open' | 'due' | 'waiting' | 'settled';

interface Plan {
  readonly current: BillingCycle;
  /** The next statement to settle (oldest with anything in it). */
  readonly next: number;
  readonly settled: ReadonlyMap<number, StatementSettlement>;
  /** Ended, unsettled cycles with something in them. */
  readonly withActivity: ReadonlySet<number>;
  readonly lastSettledEnd: (cycle: number) => Date;
}

/**
 * One statement per doctor per 30-day cycle. Settled oldest first: the
 * oldest open statement also sweeps up anything older that was missed.
 */
@Injectable()
export class StatementService {
  constructor(
    @Inject(STATEMENT_REPOSITORY)
    private readonly repository: StatementRepository,
    @Inject(BACKEND_CONFIGURATION)
    private readonly configuration: BackendConfiguration,
  ) {}

  /** Every statement worth showing: running, due, waiting and settled. */
  async list(
    access: StatementAccess,
    filter: { organizationId?: string; doctorId?: string },
    now = new Date(),
  ) {
    const organizationId = access.platformAdministrator
      ? filter.organizationId
      : access.organizationId;
    if (!access.platformAdministrator && !organizationId)
      throw new ForbiddenException('Billing access requires an organization.');
    if (
      !access.platformAdministrator &&
      filter.organizationId &&
      filter.organizationId !== organizationId
    )
      throw new ForbiddenException('Organization does not match the session.');
    const doctors = (await this.repository.doctors(organizationId)).filter(
      (doctor) =>
        this.allowed(access, doctor.doctorId) &&
        (!filter.doctorId || doctor.doctorId === filter.doctorId),
    );
    const items = [];
    for (const doctor of doctors) {
      const plan = await this.plan(doctor, now);
      const numbers = new Set<number>([
        plan.current.number,
        ...plan.withActivity,
      ]);
      for (const number of plan.settled.keys()) numbers.add(number);
      for (const number of [...numbers].sort((a, b) => b - a)) {
        const settlement = plan.settled.get(number);
        if (settlement) {
          items.push(
            this.summary(
              doctor,
              plan,
              number,
              settlement.periodStart,
              this.settledTotals(settlement),
              settlement,
              now,
            ),
          );
          continue;
        }
        const window = this.window(doctor, plan, number);
        const lines = await this.repository.openLines(doctor, window);
        items.push(
          this.summary(
            doctor,
            plan,
            number,
            cycleByNumber(doctor.cycleStart, number).start,
            this.totals(lines),
            null,
            now,
            lines.charges.length,
          ),
        );
      }
    }
    return { items };
  }

  /** The full statement, as both sides print it. */
  async document(
    access: StatementAccess,
    organizationId: string,
    doctorId: string,
    cycleNumber: number,
    now = new Date(),
  ) {
    this.scope(access, organizationId, doctorId);
    const doctor = await this.doctor(organizationId, doctorId);
    const plan = await this.plan(doctor, now);
    if (cycleNumber > plan.current.number)
      throw new NotFoundException('This statement has not started yet.');
    const cycle = cycleByNumber(doctor.cycleStart, cycleNumber);
    const settlement = plan.settled.get(cycleNumber) ?? null;
    const lines = settlement
      ? await this.repository.settledLines(doctor, settlement)
      : await this.repository.openLines(
          doctor,
          this.window(doctor, plan, cycleNumber),
        );
    const totals = settlement
      ? this.settledTotals(settlement)
      : this.totals(lines);
    const facts = await this.repository.facts(
      doctor,
      cycleQueryStart(cycle),
      cycle.end < now ? cycle.end : now,
    );
    const summary = this.summary(
      doctor,
      plan,
      cycleNumber,
      cycle.start,
      totals,
      settlement,
      now,
      lines.charges.length,
    );
    return {
      ...summary,
      issuedAt: (settlement?.settledAt ?? now).toISOString(),
      cycleStart: doctor.cycleStart,
      clinicNames: doctor.clinicNames,
      providerFeeBps: this.configuration.paymentProviderFeeBps,
      payoutAccount: doctor.payoutAccount?.number
        ? {
            name: doctor.payoutAccount.name,
            numberHint: `…${doctor.payoutAccount.number.slice(-4)}`,
          }
        : null,
      visits: facts.visits,
      revenue: {
        ...facts.revenue,
        totalIqd: facts.revenue.counterIqd + facts.revenue.onlineIqd,
      },
      // A credit sits right under the charge it cancels.
      charges: [...lines.charges]
        .sort(
          (a, b) =>
            a.recognizedAt.getTime() - b.recognizedAt.getTime() ||
            (a.originalId ?? a.id).localeCompare(b.originalId ?? b.id) ||
            (a.status === 'earned' ? 0 : 1) - (b.status === 'earned' ? 0 : 1),
        )
        .map((line) => ({
          id: line.id,
          recognizedAt: line.recognizedAt.toISOString(),
          appointmentReference: line.appointmentReference,
          appointmentStartsAt: line.appointmentStartsAt.toISOString(),
          clinicName: line.clinicName,
          planName: line.planName,
          amountIqd:
            line.status === 'earned' ? line.amountIqd : -line.amountIqd,
          kind:
            line.status === 'earned'
              ? ('charge' as const)
              : ('credit' as const),
          reason: line.reason,
        })),
      onlinePayments: lines.payments.map((line) => this.money(line)),
      refunds: lines.clawbacks.map((line) => this.money(line)),
      settlement: settlement
        ? {
            method: settlement.method,
            reference: settlement.reference,
            counterpartyName: settlement.counterpartyName,
            note: settlement.note,
            settledAt: settlement.settledAt.toISOString(),
            settledByName: settlement.settledByName,
          }
        : null,
    };
  }

  async settle(
    access: StatementAccess,
    organizationId: string,
    doctorId: string,
    cycleNumber: number,
    input: {
      method: SettlementMethod;
      expectedNetPayableIqd: number;
      reference?: string | undefined;
      counterpartyName?: string | undefined;
      note?: string | undefined;
    },
    requestId: string,
    now = new Date(),
  ) {
    if (!access.platformAdministrator)
      throw new ForbiddenException(
        'Platform administrator access is required.',
      );
    const doctor = await this.doctor(organizationId, doctorId);
    const plan = await this.plan(doctor, now);
    const cycle = cycleByNumber(doctor.cycleStart, cycleNumber);
    if (plan.settled.has(cycleNumber))
      throw new ConflictException('This statement is already settled.');
    if (cycle.end > now)
      throw new ConflictException(
        'A statement can be settled once its 30 days have ended.',
      );
    if (cycleNumber !== plan.next)
      throw new ConflictException(
        `Settle statement ${statementNumber(doctorId, plan.next)} first.`,
      );
    const reference = input.reference?.trim() || null;
    if (input.method === 'fib' && !reference)
      throw new BadRequestException('Enter the FIB transfer reference.');
    const window = this.window(doctor, plan, cycleNumber);
    const preview = this.totals(
      await this.repository.openLines(doctor, window),
    );
    if (input.method === 'fib' && preview.netPayableIqd < 0)
      throw new BadRequestException(
        'Doctors pay Saxlem in cash. Choose cash for this statement.',
      );
    if (preview.netPayableIqd !== input.expectedNetPayableIqd)
      throw new ConflictException(
        'The amounts changed. Refresh and check them again.',
      );
    const settled = await this.repository.settle({
      doctor,
      cycleNumber,
      periodStart: cycle.start,
      periodEnd: cycle.end,
      window,
      expectedNetPayableIqd: input.expectedNetPayableIqd,
      totals: (lines) => this.totals(lines),
      method: input.method,
      reference,
      counterpartyName: input.counterpartyName?.trim() || null,
      note: input.note?.trim() || null,
      actorUserId: access.actorId,
      requestId,
    });
    if (!settled)
      throw new ConflictException(
        'The amounts changed or the statement was settled. Refresh and try again.',
      );
    return this.document(access, organizationId, doctorId, cycleNumber, now);
  }

  private async plan(doctor: StatementDoctor, now: Date): Promise<Plan> {
    const current = cycleAt(doctor.cycleStart, now);
    const settled = new Map<number, StatementSettlement>();
    for (const row of doctor.settlements)
      if (row.cycleNumber) settled.set(row.cycleNumber, row);
    const activity = await this.repository.activity(doctor);
    const withActivity = new Set<number>();
    for (const at of [
      ...activity.charges,
      ...activity.payments,
      ...activity.clawbacks,
    ]) {
      let number = cycleAt(doctor.cycleStart, at).number;
      // Anything dated in a settled cycle moves to the next open one.
      while (settled.has(number)) number += 1;
      if (number < current.number) withActivity.add(number);
    }
    const next = withActivity.size ? Math.min(...withActivity) : current.number;
    const lastSettledEnd = (cycle: number) =>
      doctor.settlements
        .filter((row) => (row.cycleNumber ?? 0) < cycle)
        .reduce(
          (latest, row) => (row.periodEnd > latest ? row.periodEnd : latest),
          new Date(0),
        );
    return { current, next, settled, withActivity, lastSettledEnd };
  }

  /** The oldest open statement sweeps up anything older not yet settled;
   * later ones hold only their own 30 days. */
  private window(
    doctor: StatementDoctor,
    plan: Plan,
    number: number,
  ): StatementWindow {
    const cycle = cycleByNumber(doctor.cycleStart, number);
    if (number === plan.next)
      return {
        chargesFrom: plan.lastSettledEnd(number),
        paymentsFrom: new Date(0),
        to: cycle.end,
      };
    return {
      chargesFrom: cycleQueryStart(cycle),
      paymentsFrom: cycleQueryStart(cycle),
      to: cycle.end,
    };
  }

  private totals(lines: StatementLines) {
    const gross = lines.payments.reduce((sum, p) => sum + p.amountIqd, 0);
    const clawback = lines.clawbacks.reduce((sum, p) => sum + p.amountIqd, 0);
    const fee = this.configuration.paymentFeePassedToClinic
      ? Math.round((gross * this.configuration.paymentProviderFeeBps) / 10_000)
      : 0;
    const commission = lines.charges.reduce(
      (sum, c) => sum + (c.status === 'earned' ? c.amountIqd : -c.amountIqd),
      0,
    );
    return {
      grossCollectedIqd: gross,
      clawbackIqd: clawback,
      providerFeeIqd: fee,
      commissionIqd: commission,
      netPayableIqd: gross - clawback - fee - commission,
      paymentCount: lines.payments.length,
    };
  }

  private settledTotals(row: StatementSettlement) {
    return {
      grossCollectedIqd: row.grossCollectedIqd,
      clawbackIqd: row.clawbackIqd,
      providerFeeIqd: row.providerFeeIqd,
      commissionIqd: row.commissionIqd,
      netPayableIqd: row.netPayableIqd,
      paymentCount: row.paymentCount,
    };
  }

  private summary(
    doctor: StatementDoctor,
    plan: Plan,
    number: number,
    start: Date,
    totals: ReturnType<StatementService['totals']>,
    settlement: StatementSettlement | null,
    now: Date,
    chargeCount?: number,
  ) {
    const cycle = cycleByNumber(doctor.cycleStart, number);
    const status: Status = settlement
      ? 'settled'
      : cycle.end > now
        ? 'open'
        : number === plan.next
          ? 'due'
          : 'waiting';
    return {
      organizationId: doctor.organizationId,
      organizationName: doctor.organizationName,
      doctorId: doctor.doctorId,
      doctorName: doctor.doctorName,
      cycleNumber: number,
      statementNumber: statementNumber(doctor.doctorId, number),
      periodStart: start.toISOString(),
      periodEnd: cycle.end.toISOString(),
      status,
      canSettle: status === 'due',
      direction:
        totals.netPayableIqd > 0
          ? ('saxlemPays' as const)
          : totals.netPayableIqd < 0
            ? ('doctorPays' as const)
            : ('even' as const),
      ...totals,
      chargeCount: chargeCount ?? null,
      settlement: settlement
        ? {
            method: settlement.method,
            settledAt: settlement.settledAt.toISOString(),
          }
        : null,
    };
  }

  private money(line: StatementLines['payments'][number]) {
    return {
      id: line.id,
      at: line.at.toISOString(),
      appointmentReference: line.appointmentReference,
      amountIqd: line.amountIqd,
    };
  }

  private async doctor(organizationId: string, doctorId: string) {
    const doctor = await this.repository.doctor(organizationId, doctorId);
    if (!doctor) throw new NotFoundException('Doctor was not found.');
    return doctor;
  }

  private allowed(access: StatementAccess, doctorId: string) {
    return (
      access.platformAdministrator ||
      !access.doctorIds?.length ||
      access.doctorIds.includes(doctorId)
    );
  }

  private scope(
    access: StatementAccess,
    organizationId: string,
    doctorId: string,
  ) {
    if (access.platformAdministrator) return;
    if (
      access.organizationId !== organizationId ||
      !this.allowed(access, doctorId)
    )
      // Other doctors' statements do not exist for this desk.
      throw new NotFoundException('Statement was not found.');
  }
}
