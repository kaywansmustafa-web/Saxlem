import { ConflictException } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { createHash } from 'node:crypto';
import type { PrismaService } from '../../src/infrastructure/database/prisma.service';
import type { ArrivalCommand } from '../../src/modules/arrivals/domain/arrival';
import { PrismaArrivalRepository } from '../../src/modules/arrivals/infrastructure/prisma-arrival.repository';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.TEST_DATABASE_URL! }),
});

describe('patient arrival database domain', () => {
  afterAll(() => prisma.$disconnect());

  it('enforces ownership and tenant scope, records exact transitions, audit, and idempotent replay', async () => {
    const fixture = await createFixture();
    const repository = new PrismaArrivalRepository({
      db: prisma,
    } as unknown as PrismaService);
    const patientAccess = {
      actorId: fixture.patientUserId,
      patient: true,
      doctor: false,
      platformAdministrator: false,
    };
    const foreignPatient = {
      ...patientAccess,
      actorId: fixture.otherPatientUserId,
    };
    expect(
      await repository.get(foreignPatient, fixture.appointmentId),
    ).toBeNull();
    expect(
      await repository.get(
        {
          actorId: fixture.staffUserId,
          patient: false,
          doctor: false,
          platformAdministrator: false,
          organizationId: fixture.foreignOrganizationId,
          clinicId: fixture.foreignClinicId,
        },
        fixture.appointmentId,
      ),
    ).toBeNull();

    const command = arrivalCommand(
      'arrival-integration-key',
      fixture.appointmentId,
      1,
    );
    const occurredAt = new Date('2031-01-01T06:00:00.000Z');
    const result = await repository.record(
      patientAccess,
      fixture.appointmentId,
      1,
      occurredAt,
      'arrival-request',
      command,
    );
    expect(result).toMatchObject({
      status: 'queueReady',
      version: 3,
      arrivedAt: occurredAt.toISOString(),
      queueReadyAt: occurredAt.toISOString(),
    });
    await expect(
      repository.record(
        patientAccess,
        fixture.appointmentId,
        1,
        occurredAt,
        'arrival-request-replay',
        command,
      ),
    ).resolves.toEqual(result);
    await expect(
      repository.record(
        patientAccess,
        fixture.appointmentId,
        1,
        occurredAt,
        'arrival-request-duplicate',
        arrivalCommand('arrival-duplicate-key', fixture.appointmentId, 1),
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(
      await prisma.arrivalAudit.findMany({
        where: { arrivalId: fixture.arrivalId },
        orderBy: { occurredAt: 'asc' },
      }),
    ).toEqual([
      expect.objectContaining({ fromStatus: 'expected', toStatus: 'arrived' }),
      expect.objectContaining({
        fromStatus: 'arrived',
        toStatus: 'queueReady',
      }),
    ]);
    expect(
      await prisma.auditEvent.count({
        where: {
          action: 'arrival.recorded',
          targetId: fixture.arrivalId,
          requestId: 'arrival-request',
        },
      }),
    ).toBe(1);
    expect(
      await prisma.queueEntry.count({
        where: { appointmentId: fixture.appointmentId },
      }),
    ).toBe(0);
  }, 30_000);

  it('rejects stale concurrent commands and protects immutable lifecycle fields', async () => {
    const fixture = await createFixture();
    const repository = new PrismaArrivalRepository({
      db: prisma,
    } as unknown as PrismaService);
    const access = {
      actorId: fixture.patientUserId,
      patient: true,
      doctor: false,
      platformAdministrator: false,
    };
    const occurredAt = new Date('2031-01-01T06:00:00.000Z');
    const results = await Promise.allSettled([
      repository.record(
        access,
        fixture.appointmentId,
        1,
        occurredAt,
        'race-a',
        arrivalCommand('arrival-race-key-a', fixture.appointmentId, 1),
      ),
      repository.record(
        access,
        fixture.appointmentId,
        1,
        occurredAt,
        'race-b',
        arrivalCommand('arrival-race-key-b', fixture.appointmentId, 1),
      ),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === 'rejected'),
    ).toHaveLength(1);
    await expect(
      prisma.appointmentArrival.update({
        where: { id: fixture.arrivalId },
        data: {
          arrivedAt: new Date('2031-01-01T07:00:00.000Z'),
          version: { increment: 1 },
        },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.appointmentArrival.delete({ where: { id: fixture.arrivalId } }),
    ).rejects.toThrow();
  }, 30_000);

  it.each(['organization', 'clinic', 'doctor'] as const)(
    'rejects arrival when the %s is inactive',
    async (kind) => {
      const fixture = await createFixture();
      if (kind === 'organization')
        await prisma.organization.update({
          where: { id: fixture.organizationId },
          data: { status: 'inactive' },
        });
      if (kind === 'clinic')
        await prisma.clinic.update({
          where: { id: fixture.clinicId },
          data: { status: 'inactive' },
        });
      if (kind === 'doctor')
        await prisma.doctor.update({
          where: { id: fixture.doctorId },
          data: { status: 'inactive' },
        });
      const repository = new PrismaArrivalRepository({
        db: prisma,
      } as unknown as PrismaService);
      await expect(
        repository.record(
          {
            actorId: fixture.patientUserId,
            patient: true,
            doctor: false,
            platformAdministrator: false,
          },
          fixture.appointmentId,
          1,
          new Date('2031-01-01T06:00:00.000Z'),
          `inactive-${kind}`,
          arrivalCommand(`arrival-inactive-${kind}`, fixture.appointmentId, 1),
        ),
      ).rejects.toThrow(
        `${kind[0]!.toUpperCase()}${kind.slice(1)} is inactive.`,
      );
    },
    30_000,
  );
});

function arrivalCommand(
  key: string,
  appointmentId: string,
  expectedVersion: number,
): ArrivalCommand {
  return {
    key,
    scope: `arrival.record:${appointmentId}`,
    hash: createHash('sha256')
      .update(JSON.stringify({ appointmentId, expectedVersion }))
      .digest('hex'),
  };
}

async function createFixture() {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const organization = await prisma.organization.create({
    data: { name: `Arrival ${suffix}` },
  });
  const clinic = await prisma.clinic.create({
    data: {
      organizationId: organization.id,
      name: 'Arrival Clinic',
      code: `arrival-${suffix}`,
      timezone: 'Asia/Baghdad',
    },
  });
  const foreignOrganization = await prisma.organization.create({
    data: { name: `Foreign ${suffix}` },
  });
  const foreignClinic = await prisma.clinic.create({
    data: {
      organizationId: foreignOrganization.id,
      name: 'Foreign Clinic',
      code: `foreign-${suffix}`,
      timezone: 'Asia/Baghdad',
    },
  });
  const patientUser = await createPatient(
    `+96475${Date.now().toString().slice(-8)}`,
    'Owner',
  );
  const otherPatient = await createPatient(
    `+96476${Date.now().toString().slice(-8)}`,
    'Other',
  );
  await prisma.organizationPatientProfile.create({
    data: {
      organizationId: organization.id,
      patientProfileId: patientUser.profileId,
    },
  });
  const doctorUser = await prisma.user.create({
    data: {
      staffAccount: { create: { email: `doctor-${suffix}@example.invalid` } },
    },
    include: { staffAccount: true },
  });
  const doctor = await prisma.$transaction(async (tx) => {
    const created = await tx.doctor.create({
      data: {
        organizationId: organization.id,
        staffAccountId: doctorUser.staffAccount!.id,
        firstName: 'Arrival',
        lastName: 'Doctor',
        displayName: 'Dr. Arrival',
        gender: 'unspecified',
        licenseNumber: `ARR-${suffix}`,
        yearsOfExperience: 5,
        languages: ['english'],
      },
    });
    await tx.doctorClinicAssignment.create({
      data: {
        organizationId: organization.id,
        clinicId: clinic.id,
        doctorId: created.id,
      },
    });
    return created;
  });
  const staff = await prisma.user.create({
    data: {
      staffAccount: { create: { email: `staff-${suffix}@example.invalid` } },
    },
  });
  const appointment = await prisma.appointment.create({
    data: {
      organizationId: organization.id,
      clinicId: clinic.id,
      doctorId: doctor.id,
      patientProfileId: patientUser.profileId,
      startsAt: new Date('2031-01-01T06:00:00.000Z'),
      endsAt: new Date('2031-01-01T06:30:00.000Z'),
      durationMinutes: 30,
      feeIqd: 25000,
    },
  });
  const arrival = await prisma.appointmentArrival.create({
    data: {
      organizationId: organization.id,
      clinicId: clinic.id,
      appointmentId: appointment.id,
      patientProfileId: patientUser.profileId,
    },
  });
  return {
    organizationId: organization.id,
    clinicId: clinic.id,
    doctorId: doctor.id,
    appointmentId: appointment.id,
    arrivalId: arrival.id,
    patientUserId: patientUser.userId,
    otherPatientUserId: otherPatient.userId,
    staffUserId: staff.id,
    foreignOrganizationId: foreignOrganization.id,
    foreignClinicId: foreignClinic.id,
  };
}

async function createPatient(phone: string, name: string) {
  const user = await prisma.user.create({
    data: { patientAccount: { create: { normalizedPhoneNumber: phone } } },
    include: { patientAccount: true },
  });
  const profile = await prisma.patientProfile.create({
    data: {
      patientAccountId: user.patientAccount!.id,
      firstName: name,
      lastName: 'Patient',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'unspecified',
    },
  });
  return { userId: user.id, profileId: profile.id };
}
