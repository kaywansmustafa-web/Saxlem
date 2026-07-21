import { ConflictException } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';
import type { PrismaService } from '../../src/infrastructure/database/prisma.service';
import type { ArrivalCommand } from '../../src/modules/arrivals/domain/arrival';
import { PrismaArrivalRepository } from '../../src/modules/arrivals/infrastructure/prisma-arrival.repository';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.TEST_DATABASE_URL! }),
});
const arrivalWindow = { earlyMinutes: 60, lateMinutes: 120 } as const;

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
      arrivalWindow,
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
        arrivalWindow,
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
        arrivalWindow,
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
        arrivalWindow,
      ),
      repository.record(
        access,
        fixture.appointmentId,
        1,
        occurredAt,
        'race-b',
        arrivalCommand('arrival-race-key-b', fixture.appointmentId, 1),
        arrivalWindow,
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

  it.each(['organization', 'clinic', 'doctor', 'patient'] as const)(
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
      if (kind === 'patient')
        await prisma.patientProfile.update({
          where: { id: fixture.patientProfileId },
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
          arrivalWindow,
        ),
      ).rejects.toThrow(
        kind === 'patient'
          ? 'Patient registration is inactive.'
          : `${kind[0]!.toUpperCase()}${kind.slice(1)} is inactive.`,
      );
    },
    30_000,
  );

  it('uses the appointment time locked inside the transaction after rescheduling', async () => {
    const fixture = await createFixture();
    let rescheduled!: () => void;
    let release!: () => void;
    const changed = new Promise<void>((resolve) => (rescheduled = resolve));
    const mayCommit = new Promise<void>((resolve) => (release = resolve));
    const reschedule = prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id: fixture.appointmentId },
        data: {
          startsAt: new Date('2031-01-02T06:00:00.000Z'),
          endsAt: new Date('2031-01-02T06:30:00.000Z'),
          version: { increment: 1 },
        },
      });
      rescheduled();
      await mayCommit;
    });
    await changed;
    const repository = new PrismaArrivalRepository({
      db: prisma,
    } as unknown as PrismaService);
    let settled = false;
    const arrival = repository
      .record(
        {
          actorId: fixture.patientUserId,
          patient: true,
          doctor: false,
          platformAdministrator: false,
        },
        fixture.appointmentId,
        1,
        new Date('2031-01-01T06:00:00.000Z'),
        'rescheduled-window',
        arrivalCommand('arrival-rescheduled-window', fixture.appointmentId, 1),
        arrivalWindow,
      )
      .finally(() => (settled = true));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(settled).toBe(false);
    release();
    await reschedule;
    await expect(arrival).rejects.toBeInstanceOf(ConflictException);
    expect(
      await prisma.appointmentArrival.findUnique({
        where: { id: fixture.arrivalId },
      }),
    ).toMatchObject({ status: 'expected', version: 1 });
  });

  it('replays simultaneous requests with the same idempotency key', async () => {
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
    const command = arrivalCommand(
      'arrival-identical-race',
      fixture.appointmentId,
      1,
    );
    const occurredAt = new Date('2031-01-01T06:00:00.000Z');
    const results = await Promise.all([
      repository.record(
        access,
        fixture.appointmentId,
        1,
        occurredAt,
        'same-a',
        command,
        arrivalWindow,
      ),
      repository.record(
        access,
        fixture.appointmentId,
        1,
        occurredAt,
        'same-b',
        command,
        arrivalWindow,
      ),
    ]);
    expect(results[0]).toEqual(results[1]);
    expect(results[0]).toMatchObject({ status: 'queueReady', version: 3 });
    expect(
      await prisma.auditEvent.count({
        where: { action: 'arrival.recorded', targetId: fixture.arrivalId },
      }),
    ).toBe(1);
  });

  it('revalidates active context after a concurrent deactivation commits', async () => {
    const fixture = await createFixture();
    let deactivated!: () => void;
    let release!: () => void;
    const changed = new Promise<void>((resolve) => (deactivated = resolve));
    const mayCommit = new Promise<void>((resolve) => (release = resolve));
    const deactivate = prisma.$transaction(async (tx) => {
      await tx.organization.update({
        where: { id: fixture.organizationId },
        data: { status: 'inactive' },
      });
      deactivated();
      await mayCommit;
    });
    await changed;
    const repository = new PrismaArrivalRepository({
      db: prisma,
    } as unknown as PrismaService);
    let settled = false;
    const arrival = repository
      .record(
        {
          actorId: fixture.patientUserId,
          patient: true,
          doctor: false,
          platformAdministrator: false,
        },
        fixture.appointmentId,
        1,
        new Date('2031-01-01T06:00:00.000Z'),
        'deactivation-race',
        arrivalCommand('arrival-deactivation-race', fixture.appointmentId, 1),
        arrivalWindow,
      )
      .finally(() => (settled = true));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(settled).toBe(false);
    release();
    await deactivate;
    await expect(arrival).rejects.toThrow('Organization is inactive.');
    expect(
      await prisma.appointmentArrival.findUnique({
        where: { id: fixture.arrivalId },
      }),
    ).toMatchObject({ status: 'expected', version: 1 });
  });

  it.each([
    ['early boundary', '2031-01-01T05:00:00.000Z', true],
    ['one millisecond early', '2031-01-01T04:59:59.999Z', false],
    ['late boundary', '2031-01-01T08:00:00.000Z', true],
    ['one millisecond late', '2031-01-01T08:00:00.001Z', false],
  ] as const)(
    'enforces the TIMESTAMPTZ(3) %s',
    async (_label, timestamp, accepted) => {
      const fixture = await createFixture();
      const repository = new PrismaArrivalRepository({
        db: prisma,
      } as unknown as PrismaService);
      const operation = repository.record(
        {
          actorId: fixture.patientUserId,
          patient: true,
          doctor: false,
          platformAdministrator: false,
        },
        fixture.appointmentId,
        1,
        new Date(timestamp),
        `boundary-${timestamp}`,
        arrivalCommand(
          `arrival-boundary-${timestamp}`,
          fixture.appointmentId,
          1,
        ),
        arrivalWindow,
      );
      if (accepted)
        await expect(operation).resolves.toMatchObject({
          status: 'queueReady',
        });
      else await expect(operation).rejects.toBeInstanceOf(ConflictException);
    },
  );

  it('rejects ineligible direct inserts and forged lifecycle audits', async () => {
    const ineligible = await createFixture(false);
    await prisma.appointment.update({
      where: { id: ineligible.appointmentId },
      data: {
        status: 'cancelled',
        cancellationReason: 'Test cancellation',
        cancelledAt: new Date(),
        version: { increment: 1 },
      },
    });
    await expect(
      prisma.appointmentArrival.create({
        data: {
          organizationId: ineligible.organizationId,
          clinicId: ineligible.clinicId,
          appointmentId: ineligible.appointmentId,
          patientProfileId: ineligible.patientProfileId,
        },
      }),
    ).rejects.toThrow();

    const fixture = await createFixture();
    await expect(
      prisma.arrivalAudit.create({
        data: {
          organizationId: fixture.organizationId,
          clinicId: fixture.clinicId,
          arrivalId: fixture.arrivalId,
          actorUserId: fixture.patientUserId,
          fromStatus: 'expected',
          toStatus: 'queueReady',
          occurredAt: new Date(),
        },
      }),
    ).rejects.toThrow();
  });

  it('rolls back transitions and idempotency when mandatory audit persistence fails', async () => {
    const fixture = await createFixture();
    const repository = new PrismaArrivalRepository({
      db: prisma,
    } as unknown as PrismaService);
    const actorId = randomUUID();
    const command = arrivalCommand(
      'arrival-audit-rollback',
      fixture.appointmentId,
      1,
    );
    await expect(
      repository.record(
        {
          actorId,
          patient: false,
          doctor: false,
          platformAdministrator: true,
        },
        fixture.appointmentId,
        1,
        new Date('2031-01-01T06:00:00.000Z'),
        'audit-rollback',
        command,
        arrivalWindow,
      ),
    ).rejects.toThrow('Mandatory arrival audit persistence failed.');
    expect(
      await prisma.appointmentArrival.findUnique({
        where: { id: fixture.arrivalId },
      }),
    ).toMatchObject({
      status: 'expected',
      version: 1,
      arrivedAt: null,
      queueReadyAt: null,
    });
    expect(
      await prisma.idempotencyRecord.count({
        where: { actorId, scope: command.scope, key: command.key },
      }),
    ).toBe(0);
    expect(
      await prisma.arrivalAudit.count({
        where: { arrivalId: fixture.arrivalId },
      }),
    ).toBe(0);
  });
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

async function createFixture(createArrival = true) {
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
  const arrival = createArrival
    ? await prisma.appointmentArrival.create({
        data: {
          organizationId: organization.id,
          clinicId: clinic.id,
          appointmentId: appointment.id,
          patientProfileId: patientUser.profileId,
        },
      })
    : null;
  return {
    organizationId: organization.id,
    clinicId: clinic.id,
    doctorId: doctor.id,
    appointmentId: appointment.id,
    arrivalId: arrival?.id ?? '',
    patientProfileId: patientUser.profileId,
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
