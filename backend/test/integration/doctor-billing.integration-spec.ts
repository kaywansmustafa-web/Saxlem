import { randomBytes } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import type { PrismaService } from '../../src/infrastructure/database/prisma.service';
import { STANDARD_BILLING_PLAN_ID } from '../../src/modules/billing/domain/billing';
import { PrismaBillingRepository } from '../../src/modules/billing/infrastructure/prisma-billing.repository';
import { PrismaPayoutRepository } from '../../src/modules/payments/infrastructure/prisma-payout.repository';
import { payoutTotals } from '../../src/modules/payments/domain/payout';

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

    // Online payments are paid out per doctor, net of that doctor's commission.
    const payouts = new PrismaPayoutRepository(database);
    const payees = await payouts.payees(period.start, period.end);
    expect(
      payees
        .filter((row) => row.organizationId === fixture.organizationId)
        .map((row) => row.doctorName),
    ).toEqual(['Dr. Karwan', 'Dr. Shilan']);
    await fixture.paidOnline(fixture.shilan, 25000);
    await fixture.paidOnline(fixture.karwan, 30000);
    const shilan = await payouts.inputs(
      fixture.organizationId,
      fixture.shilan,
      period.start,
      period.end,
    );
    expect(shilan.payments.map((row) => row.amountIqd)).toEqual([25000]);
    expect(shilan.commissionIqd).toBe(2500);
    const expected = payoutTotals(shilan, 50, true);
    expect(expected.netPayableIqd).toBe(25000 - 125 - 2500);
    const settled = await payouts.settle({
      organizationId: fixture.organizationId,
      doctorId: fixture.shilan,
      start: period.start,
      end: period.end,
      expected,
      feeBps: 50,
      feePassedToClinic: true,
      reference: 'FIB-SHILAN-JAN',
      note: null,
      actorUserId: fixture.actorId,
      requestId: 'settle-shilan',
    });
    expect(settled?.netPayableIqd).toBe(22375);
    // Karwan is untouched and still owed his own money.
    const karwan = await payouts.inputs(
      fixture.organizationId,
      fixture.karwan,
      period.start,
      period.end,
    );
    expect(karwan.settled).toBeNull();
    expect(karwan.payments.map((row) => row.amountIqd)).toEqual([30000]);
    // Settling Shilan twice is refused.
    await expect(
      payouts.settle({
        organizationId: fixture.organizationId,
        doctorId: fixture.shilan,
        start: period.start,
        end: period.end,
        expected,
        feeBps: 50,
        feePassedToClinic: true,
        reference: 'again',
        note: null,
        actorUserId: fixture.actorId,
        requestId: 'settle-again',
      }),
    ).resolves.toBeNull();
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
  const completed = (doctorId: string, minute: number) =>
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
          `2026-09-05T08:${String(minute).padStart(2, '0')}:00.000Z`,
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
