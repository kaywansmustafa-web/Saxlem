import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { BackendConfiguration } from '../../../config/environment';
import type {
  StatementCharge,
  StatementDoctor,
  StatementMoney,
  StatementRepository,
  StatementSettlement,
  StatementWindow,
} from '../domain/statement';
import { StatementService, type StatementAccess } from './statement.service';

// Cycles from 2026-09-01 (Baghdad): 1 = Sep 1–Oct 1, 2 = Oct 1–Oct 31,
// 3 = Oct 31–Nov 30.
const at = (iso: string) => new Date(iso);
const now = at('2026-11-17T09:00:00Z');

const charge = (id: string, when: string, amount = 1250): StatementCharge => ({
  id,
  recognizedAt: at(when),
  appointmentReference: `SX-${id}`,
  appointmentStartsAt: at(when),
  clinicName: 'Hillview',
  planName: 'Standard',
  amountIqd: amount,
  status: 'earned',
  reason: null,
  originalId: null,
});
const money = (id: string, when: string, amount: number): StatementMoney => ({
  id,
  at: at(when),
  appointmentReference: `SX-${id}`,
  amountIqd: amount,
});

class FakeStatements implements StatementRepository {
  charges: StatementCharge[] = [
    charge('c1', '2026-09-10T08:00:00Z'),
    charge('c2', '2026-09-20T08:00:00Z'),
    charge('c3', '2026-11-05T08:00:00Z'),
  ];
  payments: StatementMoney[] = [money('p1', '2026-10-10T08:00:00Z', 25000)];
  settlements: StatementSettlement[] = [];
  settledWith: Parameters<StatementRepository['settle']>[0] | null = null;

  private record(doctorId = 'd1'): StatementDoctor {
    return {
      organizationId: 'org',
      organizationName: 'Hillview',
      doctorId,
      doctorName: doctorId === 'd1' ? 'Dr. Avin' : 'Dr. Rawand',
      cycleStart: '2026-09-01',
      clinicNames: ['Hillview'],
      settlements: this.settlements,
      payoutAccount: null,
    };
  }
  doctor(organizationId: string, doctorId: string) {
    return Promise.resolve(
      organizationId === 'org' && ['d1', 'd2'].includes(doctorId)
        ? this.record(doctorId)
        : null,
    );
  }
  doctors() {
    return Promise.resolve([this.record('d1'), this.record('d2')]);
  }
  activity(doctor: StatementDoctor) {
    const own = doctor.doctorId === 'd1';
    const covered = (when: Date) =>
      this.settlements.some((s) => s.windowStart <= when && when < s.periodEnd);
    return Promise.resolve({
      charges: own
        ? this.charges.map((c) => c.recognizedAt).filter((w) => !covered(w))
        : [],
      payments: own
        ? this.payments
            .filter((p) => !this.settlements.length || p.at > at('2026-10-01'))
            .map((p) => p.at)
        : [],
      clawbacks: [],
    });
  }
  openLines(doctor: StatementDoctor, window: StatementWindow) {
    const own = doctor.doctorId === 'd1';
    const covered = (when: Date) =>
      this.settlements.some((s) => s.windowStart <= when && when < s.periodEnd);
    return Promise.resolve({
      charges: own
        ? this.charges.filter(
            (c) =>
              c.recognizedAt >= window.chargesFrom &&
              c.recognizedAt < window.to &&
              !covered(c.recognizedAt),
          )
        : [],
      payments: own
        ? this.payments.filter(
            (p) => p.at >= window.paymentsFrom && p.at < window.to,
          )
        : [],
      clawbacks: [],
    });
  }
  settledLines() {
    return Promise.resolve({ charges: [], payments: [], clawbacks: [] });
  }
  facts() {
    return Promise.resolve({
      visits: {
        total: 12,
        completed: 9,
        noShow: 1,
        cancelled: 2,
        upcoming: 0,
        app: 6,
        phone: 3,
        walkIn: 1,
      },
      revenue: {
        counterIqd: 150000,
        counterCount: 6,
        onlineIqd: 25000,
        onlineCount: 1,
      },
    });
  }
  async settle(input: Parameters<StatementRepository['settle']>[0]) {
    this.settledWith = input;
    const lines = await this.openLines(input.doctor, input.window);
    const totals = input.totals(lines);
    const row: StatementSettlement = {
      id: `s${input.cycleNumber}`,
      cycleNumber: input.cycleNumber,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      windowStart: input.window.chargesFrom,
      method: input.method,
      reference: input.reference,
      counterpartyName: input.counterpartyName,
      note: input.note,
      settledAt: now,
      settledByName: 'owner@saxlem',
      ...totals,
    };
    this.settlements.push(row);
    return row;
  }
}

const admin: StatementAccess = { actorId: 'a', platformAdministrator: true };
const desk: StatementAccess = {
  actorId: 'r',
  platformAdministrator: false,
  organizationId: 'org',
  doctorIds: ['d1'],
};

function setup() {
  const repository = new FakeStatements();
  const configuration = {
    paymentProviderFeeBps: 50,
    paymentFeePassedToClinic: true,
  } as BackendConfiguration;
  return {
    repository,
    service: new StatementService(repository, configuration),
  };
}

describe('StatementService', () => {
  it('lists the oldest unsettled statement as due, later ones as waiting', async () => {
    const { service } = setup();
    const { items } = await service.list(admin, {}, now);
    const avin = items.filter((item) => item.doctorId === 'd1');
    expect(avin.map((item) => [item.cycleNumber, item.status])).toEqual([
      [3, 'open'],
      [2, 'waiting'],
      [1, 'due'],
    ]);
    const due = avin.find((item) => item.cycleNumber === 1)!;
    expect(due.commissionIqd).toBe(2500);
    expect(due.direction).toBe('doctorPays');
    expect(due.netPayableIqd).toBe(-2500);
    expect(due.statementNumber).toMatch(/^SX-[0-9A-F]+-001$/);
    // Saxlem owes for the second cycle: 25,000 less the 0.5% FIB fee.
    const second = avin.find((item) => item.cycleNumber === 2)!;
    expect(second.netPayableIqd).toBe(25000 - 125);
    expect(second.direction).toBe('saxlemPays');
  });

  it('settles oldest first; doctors pay in cash; FIB needs a reference', async () => {
    const { service } = setup();
    await expect(
      service.settle(
        admin,
        'org',
        'd1',
        2,
        { method: 'fib', expectedNetPayableIqd: 24875, reference: 'TX' },
        'req',
        now,
      ),
    ).rejects.toThrow('-001 first');
    await expect(
      service.settle(
        admin,
        'org',
        'd1',
        1,
        { method: 'fib', expectedNetPayableIqd: -2500, reference: 'TX' },
        'req',
        now,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.settle(
        admin,
        'org',
        'd1',
        3,
        { method: 'cash', expectedNetPayableIqd: -1250 },
        'req',
        now,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    const first = await service.settle(
      admin,
      'org',
      'd1',
      1,
      {
        method: 'cash',
        expectedNetPayableIqd: -2500,
        counterpartyName: 'Shilan',
      },
      'req',
      now,
    );
    expect(first.status).toBe('settled');
    expect(first.settlement?.method).toBe('cash');
    await expect(
      service.settle(
        admin,
        'org',
        'd1',
        2,
        { method: 'fib', expectedNetPayableIqd: 24875 },
        'req',
        now,
      ),
    ).rejects.toThrow('FIB transfer reference');
    const second = await service.settle(
      admin,
      'org',
      'd1',
      2,
      { method: 'fib', expectedNetPayableIqd: 24875, reference: 'FIB-1' },
      'req',
      now,
    );
    expect(second.settlement?.reference).toBe('FIB-1');
  });

  it('rejects stale amounts and staff settling', async () => {
    const { service } = setup();
    await expect(
      service.settle(
        admin,
        'org',
        'd1',
        1,
        { method: 'cash', expectedNetPayableIqd: -1 },
        'req',
        now,
      ),
    ).rejects.toThrow('amounts changed');
    await expect(
      service.settle(
        desk,
        'org',
        'd1',
        1,
        { method: 'cash', expectedNetPayableIqd: -2500 },
        'req',
        now,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('shows a receptionist only their doctors', async () => {
    const { service } = setup();
    const { items } = await service.list(desk, {}, now);
    expect(new Set(items.map((item) => item.doctorId))).toEqual(
      new Set(['d1']),
    );
    await expect(
      service.document(desk, 'org', 'd2', 1, now),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.document(
        { ...desk, organizationId: 'other' },
        'org',
        'd1',
        1,
        now,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('builds a full document with visits, revenue and lines', async () => {
    const { service } = setup();
    const document = await service.document(desk, 'org', 'd1', 1, now);
    expect(document.charges).toHaveLength(2);
    expect(document.charges[0]).toMatchObject({
      kind: 'charge',
      amountIqd: 1250,
    });
    expect(document.visits.completed).toBe(9);
    expect(document.revenue.totalIqd).toBe(175000);
    await expect(
      service.document(desk, 'org', 'd1', 4, now),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
