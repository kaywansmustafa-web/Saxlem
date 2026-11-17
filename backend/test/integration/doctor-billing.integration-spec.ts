import { randomBytes } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import type { PrismaService } from '../../src/infrastructure/database/prisma.service';
import { STANDARD_BILLING_PLAN_ID } from '../../src/modules/billing/domain/billing';
import { PrismaBillingRepository } from '../../src/modules/billing/infrastructure/prisma-billing.repository';
import type { BackendConfiguration } from '../../src/config/environment';
import { StatementService } from '../../src/modules/payments/application/statement.service';
import { PrismaStatementRepository } from '../../src/modules/payments/infrastructure/prisma-statement.repository';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.TEST_DATABASE_URL! }),
});
const database = { db: prisma } as unknown as PrismaService;

/** Each doctor is billed and paid separately (founder decision 2026-11-17). */
describe('per-doctor billing and payouts', () => {
  afterAll(() => prisma.$disconnect());

  it('gives each doctor their own statement, finalizes it alone, and pays each doctor separately', async () => {
    const fixture = await setup();
    const billing = new PrismaBillingRepository(database);
    const period = {
      start: new Date('2026-08-31T21:00:00.000Z'),
      end: new Date('2026-09-30T21:00:00.000Z'),
    };
    // Shilan: two qualifying app bookings. Karwan: one.
    for (const [doctorId, minute] of [
      [fixture.shilan, 0],
      [fixture.shilan, 20],
      [fixture.karwan, 40],
    ] as const) {
      const appointment = await fixture.completed(doctorId, minute);
      await prisma.$transaction((tx) =>
        billing.materializeCompletion(
          tx,
          appointment.id,
          new Date(`2026-09-05T08:${String(minute + 5).padStart(2, '0')}:00Z`),
          fixture.actorId,
          `complete-${minute}`,
        ),
      );
    }
    const ledger = await prisma.commissionLedgerEntry.findMany({
      where: { organizationId: fixture.organizationId },
    });
    expect(ledger.map((row) => row.doctorId).sort()).toEqual(
      [fixture.shilan, fixture.shilan, fixture.karwan].sort(),
    );

    const platform = { actorId: fixture.actorId, platformAdministrator: true };
    const drafts = await billing.currentStatements(
      platform,
      fixture.organizationId,
      period,
    );
    const byDoctor = new Map(
      drafts.map((row) => [row.doctorId as string, row]),
    );
    expect(byDoctor.get(fixture.shilan)).toMatchObject({
      doctorName: 'Dr. Shilan',
      qualifyingCount: 2,
      grossEarnedIqd: 2500,
    });
    expect(byDoctor.get(fixture.karwan)).toMatchObject({
      doctorName: 'Dr. Karwan',
      qualifyingCount: 1,
      grossEarnedIqd: 1250,
    });

    // Shilan's receptionist sees only Shilan's bill and commission.
    const desk = {
      actorId: fixture.actorId,
      platformAdministrator: false,
      organizationId: fixture.organizationId,
      doctorIds: [fixture.shilan],
    };
    const deskDrafts = await billing.currentStatements(
      desk,
      fixture.organizationId,
      period,
    );
    expect(deskDrafts.map((row) => row.doctorId)).toEqual([fixture.shilan]);
    const deskCommission = await billing.commissions(
      desk,
      fixture.organizationId,
      50,
    );
    expect(
      deskCommission.items.every((row) => row.doctorId === fixture.shilan),
    ).toBe(true);
    await expect(
      billing.statement(desk, byDoctor.get(fixture.karwan)!.id),
    ).resolves.toBeNull();
    // Asking for another doctor by id still returns nothing.
    expect(
      await billing.currentStatements(
        desk,
        fixture.organizationId,
        period,
        fixture.karwan,
      ),
    ).toEqual([]);

    // Finalizing Karwan's month locks only his lines.
    const karwanDraft = byDoctor.get(fixture.karwan)!;
    const finalized = await billing.finalize(
      platform,
      karwanDraft.id,
      karwanDraft.version,
      'finalize-karwan',
      { key: 'finalize-karwan-1', scope: 'test', hash: 'h' },
    );
    expect(finalized).toMatchObject({
      status: 'finalized',
      doctorId: fixture.karwan,
      qualifyingCount: 1,
    });
    expect(
      await prisma.billingStatementLine.count({
        where: { statementId: karwanDraft.id },
      }),
    ).toBe(1);
    const shilanStill = await prisma.billingStatement.findUniqueOrThrow({
      where: { id: byDoctor.get(fixture.shilan)!.id },
    });
    expect(shilanStill.status).toBe('draft');

    // 30-day statements from the day the clinic was listed (2026-09-01):
    // cycle 1 = Sep 1–Oct 1 (Baghdad). On Oct 5 cycle 1 is due.
    await prisma.organization.update({
      where: { id: fixture.organizationId },
      data: { billingCycleStart: new Date('2026-09-01T00:00:00.000Z') },
    });
    const now = new Date('2026-10-05T09:00:00.000Z');
    const statements = new StatementService(
      new PrismaStatementRepository(database),
      {
        paymentProviderFeeBps: 50,
        paymentFeePassedToClinic: true,
      } as BackendConfiguration,
    );
    await fixture.paidOnline(fixture.shilan, 25000);

    // Karwan gets a second charge, then Saxlem credits it with a reason.
    const extra = await fixture.completed(fixture.karwan, 50);
    await prisma.$transaction((tx) =>
      billing.materializeCompletion(
        tx,
        extra.id,
        new Date('2026-09-05T08:55:00Z'),
        fixture.actorId,
        'complete-extra',
      ),
    );
    const extraCharge = await prisma.commissionLedgerEntry.findFirstOrThrow({
      where: { appointmentId: extra.id },
    });
    const credit = await billing.creditCommission(
      platform,
      extraCharge.id,
      'Patient left before the visit',
      'credit-extra',
    );
    expect(credit).toMatchObject({
      status: 'reversed',
      reason: 'Patient left before the visit',
    });
    await expect(
      billing.creditCommission(platform, extraCharge.id, 'again', 'credit-2'),
    ).rejects.toThrow('already credited');

    const { items } = await statements.list(
      platform,
      { organizationId: fixture.organizationId },
      now,
    );
    const due = (doctorId: string) =>
      items.find((row) => row.doctorId === doctorId && row.cycleNumber === 1)!;
    expect(due(fixture.shilan)).toMatchObject({
      status: 'due',
      direction: 'saxlemPays',
      commissionIqd: 2500,
      grossCollectedIqd: 25000,
      netPayableIqd: 25000 - 125 - 2500,
    });
    expect(due(fixture.karwan)).toMatchObject({
      status: 'due',
      direction: 'doctorPays',
      commissionIqd: 1250,
      netPayableIqd: -1250,
    });
    expect(
      items.find(
        (row) => row.doctorId === fixture.shilan && row.cycleNumber === 2,
      )?.status,
    ).toBe('open');

    // Shilan's receptionist sees only Shilan's statements.
    const deskList = await statements.list(desk, {}, now);
    expect(new Set(deskList.items.map((row) => row.doctorId))).toEqual(
      new Set([fixture.shilan]),
    );
    await expect(
      statements.document(desk, fixture.organizationId, fixture.karwan, 1, now),
    ).rejects.toThrow('not found');

    // The full statement: visits, charges with the credit, app payments.
    const karwanDocument = await statements.document(
      platform,
      fixture.organizationId,
      fixture.karwan,
      1,
      now,
    );
    expect(
      karwanDocument.charges.map((row) => [row.kind, row.amountIqd]),
    ).toEqual([
      ['charge', 1250],
      ['charge', 1250],
      ['credit', -1250],
    ]);
    expect(karwanDocument.visits.completed).toBe(2);

    // Saxlem pays Shilan by FIB; Karwan pays Saxlem in cash.
    const shilanSettled = await statements.settle(
      platform,
      fixture.organizationId,
      fixture.shilan,
      1,
      {
        method: 'fib',
        expectedNetPayableIqd: 22375,
        reference: 'FIB-SHILAN-1',
      },
      'settle-shilan',
      now,
    );
    expect(shilanSettled).toMatchObject({
      status: 'settled',
      netPayableIqd: 22375,
      settlement: { method: 'fib', reference: 'FIB-SHILAN-1' },
    });
    expect(shilanSettled.onlinePayments.map((row) => row.amountIqd)).toEqual([
      25000,
    ]);
    await expect(
      statements.settle(
        platform,
        fixture.organizationId,
        fixture.karwan,
        1,
        { method: 'fib', expectedNetPayableIqd: -1250, reference: 'x' },
        'settle-karwan-fib',
        now,
      ),
    ).rejects.toThrow('cash');
    const karwanSettled = await statements.settle(
      platform,
      fixture.organizationId,
      fixture.karwan,
      1,
      {
        method: 'cash',
        expectedNetPayableIqd: -1250,
        counterpartyName: 'Karwan reception',
      },
      'settle-karwan',
      now,
    );
    expect(karwanSettled.settlement).toMatchObject({
      method: 'cash',
      counterpartyName: 'Karwan reception',
    });
    await expect(
      statements.settle(
        platform,
        fixture.organizationId,
        fixture.shilan,
        1,
        { method: 'cash', expectedNetPayableIqd: 22375 },
        'settle-again',
        now,
      ),
    ).rejects.toThrow('already settled');

    // A settled charge can no longer be credited.
    const shilanCharge = ledger.find((row) => row.doctorId === fixture.shilan)!;
    await expect(
      billing.creditCommission(platform, shilanCharge.id, 'late', 'credit-3'),
    ).rejects.toThrow('already settled');

    // A doctor's own free plan wins over the organization plan.
    const free = await billing.createPlan(
      platform,
      { displayName: `Pilot ${Date.now()}`, commissionAmountIqd: 0 },
      'plan-free',
    );
    await billing.assignDoctorPlan(
      platform,
      fixture.organizationId,
      fixture.shilan,
      free.id,
      new Date('2026-10-01T00:00:00.000Z'),
      'plan-shilan',
    );
    const later = await fixture.completed(fixture.shilan, 30, '2026-10-02');
    await prisma.$transaction((tx) =>
      billing.materializeCompletion(
        tx,
        later.id,
        new Date('2026-10-02T08:35:00Z'),
        fixture.actorId,
        'complete-free',
      ),
    );
    expect(
      await prisma.commissionLedgerEntry.count({
        where: { appointmentId: later.id },
      }),
    ).toBe(0);
    const setupView = await billing.setup(
      fixture.organizationId,
      new Date('2026-10-05T09:00:00.000Z'),
    );
    const shilanSetup = (
      setupView!.doctors as {
        doctorId: string;
        effectivePlan: { id: string };
      }[]
    ).find((row) => row.doctorId === fixture.shilan);
    expect(shilanSetup?.effectivePlan.id).toBe(free.id);
    expect(setupView!.cycleStart).toBe('2026-09-01');
  }, 60_000);
});

async function setup() {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const organization = await prisma.organization.create({
    data: { name: `Doctor billing ${suffix}` },
  });
  const clinic = await prisma.clinic.create({
    data: {
      organizationId: organization.id,
      name: 'Shared Clinic',
      code: `doctor-billing-${suffix}`,
      timezone: 'Asia/Baghdad',
    },
  });
  const actor = await prisma.user.create({ data: {} });
  const patient = await prisma.user.create({
    data: {
      patientAccount: {
        create: { normalizedPhoneNumber: `+96477${suffix.slice(-8)}` },
      },
    },
    include: { patientAccount: true },
  });
  const profile = await prisma.patientProfile.create({
    data: {
      patientAccountId: patient.patientAccount!.id,
      firstName: 'Shared',
      lastName: 'Patient',
      dateOfBirth: new Date('1990-01-01'),
    },
  });
  await prisma.organizationPatientProfile.create({
    data: { organizationId: organization.id, patientProfileId: profile.id },
  });
  const doctor = async (name: string) => {
    const staff = await prisma.user.create({
      data: {
        staffAccount: {
          create: {
            email: `${name.toLowerCase()}-${suffix}@example.invalid`,
          },
        },
      },
      include: { staffAccount: true },
    });
    return prisma.$transaction(async (tx) => {
      const row = await tx.doctor.create({
        data: {
          organizationId: organization.id,
          staffAccountId: staff.staffAccount!.id,
          firstName: name,
          lastName: 'Demo',
          displayName: `Dr. ${name}`,
          gender: 'unspecified',
          licenseNumber: `DB-${name}-${suffix}`,
          yearsOfExperience: 5,
          languages: ['english'],
        },
      });
      await tx.doctorClinicAssignment.create({
        data: {
          organizationId: organization.id,
          clinicId: clinic.id,
          doctorId: row.id,
        },
      });
      return row.id;
    });
  };
  const shilan = await doctor('Shilan');
  const karwan = await doctor('Karwan');
  await prisma.organizationPlanAssignment.create({
    data: {
      organizationId: organization.id,
      planId: STANDARD_BILLING_PLAN_ID,
      effectiveFrom: new Date('2026-08-10T00:00:00.000Z'),
    },
  });
  let day = 1;
  const completed = (doctorId: string, minute: number, date = '2026-09-05') =>
    prisma.appointment.create({
      data: {
        organizationId: organization.id,
        clinicId: clinic.id,
        doctorId,
        patientProfileId: profile.id,
        origin: 'patientBooked',
        type: 'initial',
        reason: 'Billing fixture',
        startsAt: new Date(
          `${date}T08:${String(minute).padStart(2, '0')}:00.000Z`,
        ),
        durationMinutes: 10,
        feeIqd: 25000,
        status: 'completed',
      },
    });
  const paidOnline = async (doctorId: string, amountIqd: number) => {
    const appointment = await prisma.appointment.create({
      data: {
        organizationId: organization.id,
        clinicId: clinic.id,
        doctorId,
        patientProfileId: profile.id,
        origin: 'patientBooked',
        type: 'followUp',
        reason: 'Online payment fixture',
        startsAt: new Date(
          `2026-09-${String(10 + day++).padStart(2, '0')}T09:00:00.000Z`,
        ),
        durationMinutes: 10,
        feeIqd: amountIqd,
        status: 'scheduled',
      },
    });
    return prisma.appointmentPayment.create({
      data: {
        organizationId: organization.id,
        clinicId: clinic.id,
        appointmentId: appointment.id,
        method: 'online',
        status: 'paid',
        amountIqd,
        provider: 'simulated',
        collectedBy: 'platform',
        paidAt: new Date('2026-09-15T09:00:00.000Z'),
        callbackToken: randomBytes(24).toString('hex'),
      },
    });
  };
  return {
    organizationId: organization.id,
    clinicId: clinic.id,
    actorId: actor.id,
    shilan,
    karwan,
    completed,
    paidOnline,
  };
}
