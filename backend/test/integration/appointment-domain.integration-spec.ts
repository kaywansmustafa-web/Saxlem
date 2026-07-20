import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { ConflictException } from '@nestjs/common';
import type { PrismaService } from '../../src/infrastructure/database/prisma.service';
import { PrismaAppointmentRepository } from '../../src/modules/appointments/infrastructure/prisma-appointment.repository';
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
          publicReference: 'SX-2030-999999',
          type: 'initial',
          reason: 'Caller supplied reference',
          startsAt: new Date('2030-07-22T07:00:00.000Z'),
          endsAt: new Date('2030-07-22T07:30:00.000Z'),
          durationMinutes: 30,
          feeIqd: 20000,
        },
      }),
    ).rejects.toThrow();
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
    await expect(
      prisma.appointment.update({
        where: { id: first.id },
        data: { reason: 'Unversioned protected update' },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.appointment.update({
        where: { id: first.id },
        data: {
          durationMinutes: 4,
          endsAt: new Date('2030-07-22T06:04:00.000Z'),
          version: { increment: 1 },
        },
      }),
    ).rejects.toThrow();
    await prisma.appointment.update({
      where: { id: first.id },
      data: {
        status: 'cancelled',
        cancellationReason: 'Patient request',
        cancelledAt: new Date(),
        version: { increment: 1 },
      },
    });
    const replacement = await prisma.appointment.create({
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
    });
    expect(replacement.publicReference).not.toBe(first.publicReference);
    await expect(
      prisma.appointment.delete({ where: { id: first.id } }),
    ).rejects.toThrow();

    const otherOrganization = await prisma.organization.create({
      data: { name: `Other ${suffix}` },
    });
    await expect(
      prisma.appointmentEvent.create({
        data: {
          organizationId: otherOrganization.id,
          appointmentId: first.id,
          type: 'cross-tenant',
          payload: {},
          occurredAt: new Date(),
        },
      }),
    ).rejects.toThrow();

    const concurrent = await Promise.all(
      Array.from({ length: 4 }, (_, index) =>
        prisma.appointment.create({
          data: {
            organizationId: organization.id,
            clinicId: clinic.id,
            doctorId: doctor.id,
            patientProfileId: profile.id,
            type: 'initial',
            reason: `Cancelled reference ${index}`,
            startsAt: new Date(`2030-07-23T0${index}:00:00.000Z`),
            endsAt: new Date(`2030-07-23T0${index}:30:00.000Z`),
            durationMinutes: 30,
            feeIqd: 20000,
            status: 'cancelled',
            cancellationReason: 'Reference test',
            cancelledAt: new Date(),
          },
        }),
      ),
    );
    expect(new Set(concurrent.map((item) => item.publicReference)).size).toBe(
      4,
    );

    const raceInput = {
      organizationId: organization.id,
      clinicId: clinic.id,
      doctorId: doctor.id,
      patientProfileId: profile.id,
      type: 'initial' as const,
      reason: 'Concurrent overlap',
      startsAt: new Date('2030-07-24T06:00:00.000Z'),
      endsAt: new Date('2030-07-24T06:30:00.000Z'),
      durationMinutes: 30,
      feeIqd: 20000,
    };
    const race = await Promise.allSettled([
      prisma.appointment.create({ data: raceInput }),
      prisma.appointment.create({ data: raceInput }),
    ]);
    expect(race.filter((result) => result.status === 'fulfilled')).toHaveLength(
      1,
    );
    expect(race.filter((result) => result.status === 'rejected')).toHaveLength(
      1,
    );
    await expect(
      Promise.all([
        prisma.appointment.create({
          data: {
            ...raceInput,
            reason: 'Concurrent valid A',
            startsAt: new Date('2030-07-24T07:00:00.000Z'),
            endsAt: new Date('2030-07-24T07:30:00.000Z'),
          },
        }),
        prisma.appointment.create({
          data: {
            ...raceInput,
            reason: 'Concurrent valid B',
            startsAt: new Date('2030-07-24T08:00:00.000Z'),
            endsAt: new Date('2030-07-24T08:30:00.000Z'),
          },
        }),
      ]),
    ).resolves.toHaveLength(2);

    const repository = new PrismaAppointmentRepository({
      db: prisma,
    } as unknown as PrismaService);
    const access = {
      actorId: patientUser.id,
      patient: true,
      doctor: false,
      platformAdministrator: false,
    };
    const idempotentInput = {
      ...raceInput,
      reason: 'Idempotent booking',
      startsAt: new Date('2030-07-25T06:00:00.000Z'),
      endsAt: new Date('2030-07-25T06:30:00.000Z'),
    };
    const command = {
      key: 'integration-idempotency-1',
      scope: 'appointment.create',
      hash: 'same-fingerprint',
      responseCode: 201 as const,
    };
    const created = await repository.create(
      access,
      idempotentInput,
      'request-idempotent',
      command,
      () => Promise.resolve(),
    );
    const replay = await repository.create(
      access,
      idempotentInput,
      'request-replay',
      command,
      () => Promise.reject(new Error('Replay must not revalidate.')),
    );
    expect(replay).toEqual(created);
    await expect(
      repository.create(
        access,
        idempotentInput,
        'request-conflict',
        { ...command, hash: 'different-fingerprint' },
        () => Promise.resolve(),
      ),
    ).rejects.toThrow('Idempotency key');
    await expect(
      repository.create(
        access,
        { ...idempotentInput, reason: 'Known overlap mapping' },
        'request-overlap',
        {
          key: 'integration-overlap-key',
          scope: 'appointment.create',
          hash: 'overlap-fingerprint',
          responseCode: 201,
        },
        () => Promise.resolve(),
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    const cancelCommand = {
      key: 'integration-idempotency-2',
      scope: `appointment.cancel:${created.id}`,
      hash: 'cancel-fingerprint',
      responseCode: 200 as const,
    };
    const cancelled = await repository.cancel(
      access,
      created.id,
      'Patient request',
      created.version,
      'request-cancel',
      cancelCommand,
    );
    const cancelReplay = await repository.cancel(
      access,
      created.id,
      'Patient request',
      created.version,
      'request-cancel-replay',
      cancelCommand,
    );
    expect(cancelReplay).toEqual(cancelled);

    const firstPage = await repository.list(access, {
      from: new Date('2030-07-20T00:00:00Z'),
      to: new Date('2030-08-20T00:00:00Z'),
      pageSize: 2,
    });
    expect(firstPage.items).toHaveLength(2);
    expect(firstPage.nextCursor).toBeTruthy();
    const nextPage = await repository.list(access, {
      from: new Date('2030-07-20T00:00:00Z'),
      to: new Date('2030-08-20T00:00:00Z'),
      pageSize: 2,
      cursor: firstPage.nextCursor!,
    });
    expect(nextPage.items).toHaveLength(2);
    expect(nextPage.items[0]!.id).not.toBe(firstPage.items[0]!.id);
    await expect(
      repository.list(access, {
        from: new Date('2030-07-20T00:00:00Z'),
        to: new Date('2030-08-20T00:00:00Z'),
        pageSize: 2,
        cursor: otherOrganization.id,
      }),
    ).rejects.toThrow('cursor');

    await prisma.clinicWorkingHours.create({
      data: {
        organizationId: organization.id,
        clinicId: clinic.id,
        weekday: 1,
        opensMinute: 480,
        closesMinute: 960,
      },
    });
    const weekly = await prisma.doctorWeeklySchedule.create({
      data: {
        organizationId: organization.id,
        clinicId: clinic.id,
        doctorId: other.id,
        weekday: 1,
        startsMinute: 480,
        endsMinute: 960,
      },
    });
    await expectUsesBookingLock(organization.id, other.id, () =>
      prisma.doctorWeeklySchedule.delete({ where: { id: weekly.id } }),
    );
    await expectUsesBookingLock(organization.id, other.id, () =>
      prisma.doctorLeave.create({
        data: {
          organizationId: organization.id,
          clinicId: clinic.id,
          doctorId: other.id,
          startsAt: new Date('2030-08-01T06:00:00Z'),
          endsAt: new Date('2030-08-01T07:00:00Z'),
        },
      }),
    );
    await prisma.doctorLeave.updateMany({
      where: { organizationId: organization.id, doctorId: other.id },
      data: { status: 'inactive', version: { increment: 1 } },
    });
    await expectUsesBookingLock(organization.id, other.id, () =>
      prisma.doctor.update({
        where: { id: other.id },
        data: { status: 'inactive' },
      }),
    );
  }, 60_000);
});
async function expectUsesBookingLock(
  organizationId: string,
  doctorId: string,
  operation: () => Promise<unknown>,
) {
  let announceLock!: () => void;
  let releaseLock!: () => void;
  const locked = new Promise<void>((resolve) => (announceLock = resolve));
  const release = new Promise<void>((resolve) => (releaseLock = resolve));
  const holder = prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${organizationId}:${doctorId}`}, 0))`;
    announceLock();
    await release;
  });
  await locked;
  let settled = false;
  const pending = operation().finally(() => (settled = true));
  await new Promise((resolve) => setTimeout(resolve, 40));
  expect(settled).toBe(false);
  releaseLock();
  await holder;
  await pending;
}
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
