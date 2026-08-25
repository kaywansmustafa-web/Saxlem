import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import type { PrismaService } from '../../src/infrastructure/database/prisma.service';
import { STANDARD_BILLING_PLAN_ID } from '../../src/modules/billing/domain/billing';
import { PrismaBillingRepository } from '../../src/modules/billing/infrastructure/prisma-billing.repository';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.TEST_DATABASE_URL! }),
});

describe('billing foundation', () => {
  afterAll(() => prisma.$disconnect());

  it('materializes exactly one qualifying commission and excludes nonqualifying origins and types', async () => {
    const suffix = Date.now().toString();
    const organization = await prisma.organization.create({
      data: { name: `Billing ${suffix}` },
    });
    const clinic = await prisma.clinic.create({
      data: {
        organizationId: organization.id,
        name: 'Billing Clinic',
        code: `billing-${suffix}`,
        timezone: 'Asia/Baghdad',
      },
    });
    const actor = await prisma.user.create({ data: {} });
    const patient = await prisma.user.create({
      data: {
        patientAccount: {
          create: { normalizedPhoneNumber: `+96476${suffix.slice(-8)}` },
        },
      },
      include: { patientAccount: true },
    });
    const profile = await prisma.patientProfile.create({
      data: {
        patientAccountId: patient.patientAccount!.id,
        firstName: 'Billing',
        lastName: 'Patient',
        dateOfBirth: new Date('1990-01-01'),
      },
    });
    await prisma.organizationPatientProfile.create({
      data: { organizationId: organization.id, patientProfileId: profile.id },
    });
    const staff = await prisma.user.create({
      data: {
        staffAccount: {
          create: { email: `billing-${suffix}@example.invalid` },
        },
      },
      include: { staffAccount: true },
    });
    const doctor = await prisma.$transaction(async (tx) => {
      const row = await tx.doctor.create({
        data: {
          organizationId: organization.id,
          staffAccountId: staff.staffAccount!.id,
          firstName: 'Billing',
          lastName: 'Doctor',
          displayName: 'Dr. Billing',
          gender: 'unspecified',
          licenseNumber: `BILL-${suffix}`,
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
      return row;
    });
    await prisma.organizationPlanAssignment.create({
      data: {
        organizationId: organization.id,
        planId: STANDARD_BILLING_PLAN_ID,
        effectiveFrom: new Date('2026-08-10T00:00:00.000Z'),
      },
    });
    const create = (
      origin: 'patientBooked' | 'clinicCreated',
      type: 'initial' | 'followUp',
      minute: number,
    ) =>
      prisma.appointment.create({
        data: {
          organizationId: organization.id,
          clinicId: clinic.id,
          doctorId: doctor.id,
          patientProfileId: profile.id,
          origin,
          type,
          reason: 'Financial fixture',
          startsAt: new Date(
            `2032-01-01T08:${String(minute).padStart(2, '0')}:00.000Z`,
          ),
          durationMinutes: 10,
          feeIqd: 25000,
          status: 'completed',
        },
      });
    const [qualifying, clinicCreated, followUp] = await Promise.all([
      create('patientBooked', 'initial', 0),
      create('clinicCreated', 'initial', 20),
      create('patientBooked', 'followUp', 40),
    ]);
    const repository = new PrismaBillingRepository({
      db: prisma,
    } as unknown as PrismaService);
    const complete = (appointmentId: string) =>
      prisma.$transaction((tx) =>
        repository.materializeCompletion(
          tx,
          appointmentId,
          new Date('2032-01-01T08:10:00.000Z'),
          actor.id,
          `request-${appointmentId}`,
        ),
      );
    await complete(qualifying.id);
    await complete(qualifying.id);
    await complete(clinicCreated.id);
    await complete(followUp.id);
    const entries = await prisma.commissionLedgerEntry.findMany({
      where: { organizationId: organization.id },
    });
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      appointmentId: qualifying.id,
      amountIqd: 1250,
      currency: 'IQD',
      ruleCode: 'QUALIFYING_INITIAL_PATIENT_BOOKED_COMPLETION',
      ruleVersion: 1,
      status: 'earned',
    });
    const [beforeActivation, atActivation, afterActivation] = await Promise.all(
      [
        create('patientBooked', 'initial', 1),
        create('patientBooked', 'initial', 2),
        create('patientBooked', 'initial', 3),
      ],
    );
    await prisma.$transaction((tx) =>
      repository.materializeCompletion(
        tx,
        beforeActivation.id,
        new Date('2026-08-09T23:59:59.999Z'),
        actor.id,
        `request-${beforeActivation.id}`,
      ),
    );
    await prisma.$transaction((tx) =>
      repository.materializeCompletion(
        tx,
        atActivation.id,
        new Date('2026-08-10T00:00:00.000Z'),
        actor.id,
        `request-${atActivation.id}`,
      ),
    );
    await prisma.$transaction((tx) =>
      repository.materializeCompletion(
        tx,
        afterActivation.id,
        new Date('2026-08-10T00:00:00.001Z'),
        actor.id,
        `request-${afterActivation.id}`,
      ),
    );
    expect(
      await prisma.commissionLedgerEntry.count({
        where: { organizationId: organization.id },
      }),
    ).toBe(3);
    await expect(
      prisma.commissionLedgerEntry.update({
        where: { id: entries[0]!.id },
        data: { amountIqd: 1 },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.commissionLedgerEntry.create({
        data: {
          organizationId: organization.id,
          clinicId: clinic.id,
          appointmentId: qualifying.id,
          planId: entries[0]!.planId,
          originalCommissionId: entries[0]!.id,
          amountIqd: 1,
          currency: 'IQD',
          ruleCode: entries[0]!.ruleCode,
          ruleVersion: entries[0]!.ruleVersion,
          planVersion: entries[0]!.planVersion,
          appointmentType: entries[0]!.appointmentType,
          appointmentOrigin: entries[0]!.appointmentOrigin,
          completedAt: entries[0]!.completedAt,
          recognizedAt: new Date(entries[0]!.recognizedAt.getTime() + 1),
          status: 'reversed',
          reversalReason: 'Invalid partial reversal',
          reversalActorId: actor.id,
        },
      }),
    ).rejects.toThrow(/fully mirror/u);

    const finalized = await prisma.billingStatement.create({
      data: {
        organizationId: organization.id,
        periodStart: new Date('2031-12-01T21:00:00.000Z'),
        periodEnd: new Date('2032-01-31T21:00:00.000Z'),
        status: 'finalized',
        finalizedAt: new Date(),
        finalizedById: actor.id,
      },
    });
    await expect(
      prisma.billingStatementLine.create({
        data: {
          statementId: finalized.id,
          ledgerEntryId: entries[0]!.id,
          clinicId: clinic.id,
          appointmentId: qualifying.id,
          appointmentReference: qualifying.publicReference,
          recognizedAt: entries[0]!.recognizedAt,
          status: 'earned',
          amountIqd: entries[0]!.amountIqd,
          netAmountIqd: entries[0]!.amountIqd,
          currency: 'IQD',
        },
      }),
    ).rejects.toThrow(/draft statement/u);
  });
});
