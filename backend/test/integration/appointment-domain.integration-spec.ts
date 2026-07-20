import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.TEST_DATABASE_URL! }),
});
describe('appointment database domain', () => {
  afterAll(() => prisma.$disconnect());
  it('generates immutable references and enforces doctor and patient overlaps', async () => {
    const suffix = Date.now().toString();
    const organization = await prisma.organization.create({
      data: { name: `Appointment ${suffix}` },
    });
    const clinic = await prisma.clinic.create({
      data: {
        organizationId: organization.id,
        name: 'Appointment Clinic',
        code: `appointment-${suffix}`,
        timezone: 'Asia/Baghdad',
      },
    });
    const patientUser = await prisma.user.create({
      data: {
        patientAccount: {
          create: { normalizedPhoneNumber: `+96475${suffix.slice(-8)}` },
        },
      },
      include: { patientAccount: true },
    });
    const profile = await prisma.patientProfile.create({
      data: {
        patientAccountId: patientUser.patientAccount!.id,
        firstName: 'Test',
        lastName: 'Patient',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'unspecified',
      },
    });
    await prisma.organizationPatientProfile.create({
      data: { organizationId: organization.id, patientProfileId: profile.id },
    });
    const doctor = await createDoctor(
      organization.id,
      clinic.id,
      `A-${suffix}`,
    );
    const other = await createDoctor(organization.id, clinic.id, `B-${suffix}`);
    const startsAt = new Date('2030-07-22T06:00:00.000Z');
    const endsAt = new Date('2030-07-22T06:30:00.000Z');
    const first = await prisma.appointment.create({
      data: {
        organizationId: organization.id,
        clinicId: clinic.id,
        doctorId: doctor.id,
        patientProfileId: profile.id,
        type: 'initial',
        reason: 'Consultation',
        startsAt,
        endsAt,
        durationMinutes: 30,
        feeIqd: 20000,
      },
    });
    expect(first.publicReference).toMatch(/^SX-\d{4}-\d{6,}$/);
    await expect(
      prisma.appointment.create({
        data: {
          organizationId: organization.id,
          clinicId: clinic.id,
          doctorId: doctor.id,
          patientProfileId: profile.id,
          type: 'initial',
          reason: 'Overlap',
          startsAt,
          endsAt,
          durationMinutes: 30,
          feeIqd: 0,
        },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.appointment.create({
        data: {
          organizationId: organization.id,
          clinicId: clinic.id,
          doctorId: other.id,
          patientProfileId: profile.id,
          type: 'followUp',
          reason: 'Patient overlap',
          startsAt,
          endsAt,
          durationMinutes: 30,
          feeIqd: 0,
        },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.appointment.update({
        where: { id: first.id },
        data: { publicReference: 'CHANGED' },
      }),
    ).rejects.toThrow();
    await prisma.appointment.update({
      where: { id: first.id },
      data: {
        status: 'cancelled',
        cancellationReason: 'Patient request',
        cancelledAt: new Date(),
      },
    });
    await expect(
      prisma.appointment.create({
        data: {
          organizationId: organization.id,
          clinicId: clinic.id,
          doctorId: doctor.id,
          patientProfileId: profile.id,
          type: 'initial',
          reason: 'Replacement',
          startsAt,
          endsAt,
          durationMinutes: 30,
          feeIqd: 0,
        },
      }),
    ).resolves.toBeDefined();
  }, 60_000);
});
async function createDoctor(
  organizationId: string,
  clinicId: string,
  key: string,
) {
  const user = await prisma.user.create({
    data: {
      staffAccount: {
        create: { email: `${key.toLowerCase()}@example.invalid` },
      },
    },
    include: { staffAccount: true },
  });
  return prisma.$transaction(async (tx) => {
    const doctor = await tx.doctor.create({
      data: {
        organizationId,
        staffAccountId: user.staffAccount!.id,
        firstName: 'Doctor',
        lastName: key,
        displayName: `Dr. ${key}`,
        gender: 'unspecified',
        licenseNumber: `LIC-${key}`,
        yearsOfExperience: 5,
        languages: ['english'],
      },
    });
    await tx.doctorClinicAssignment.create({
      data: { organizationId, clinicId, doctorId: doctor.id },
    });
    return doctor;
  });
}
