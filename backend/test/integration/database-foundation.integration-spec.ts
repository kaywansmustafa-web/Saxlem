import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { assertSafeDatabaseUrl } from '../../scripts/database-safety';

const connection = assertSafeDatabaseUrl(process.env.TEST_DATABASE_URL, 'test');
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: connection.toString() }),
});

async function tenant(label: string) {
  const organization = await prisma.organization.create({
    data: { name: `Fictional Organization ${label}` },
  });
  const clinic = await prisma.clinic.create({
    data: {
      organizationId: organization.id,
      name: `Fictional Clinic ${label}`,
      code: `fictional-${label}`,
      timezone: 'Asia/Baghdad',
    },
  });
  const staffUser = await prisma.user.create({ data: {} });
  const staff = await prisma.staffAccount.create({
    data: { userId: staffUser.id, email: `${label}@example.invalid` },
  });
  const doctor = await prisma.$transaction(async (transaction) => {
    const created = await transaction.doctor.create({
      data: {
        organizationId: organization.id,
        staffAccountId: staff.id,
        firstName: 'Fictional',
        lastName: `Clinician ${label}`,
        displayName: `Fictional Clinician ${label}`,
        gender: 'unspecified',
        licenseNumber: `TEST-${label}`,
        yearsOfExperience: 1,
        languages: ['english'],
      },
    });
    await transaction.doctorClinicAssignment.create({
      data: {
        organizationId: organization.id,
        clinicId: clinic.id,
        doctorId: created.id,
      },
    });
    return created;
  });
  const patientUser = await prisma.user.create({ data: {} });
  const account = await prisma.patientAccount.create({
    data: {
      userId: patientUser.id,
      normalizedPhoneNumber: `fictional-${label}`,
    },
  });
  const profile = await prisma.patientProfile.create({
    data: {
      patientAccountId: account.id,
      firstName: 'Fictional',
      lastName: label,
      dateOfBirth: new Date('2000-01-01T00:00:00.000Z'),
    },
  });
  await prisma.organizationPatientProfile.create({
    data: { organizationId: organization.id, patientProfileId: profile.id },
  });
  return { organization, clinic, staffUser, doctor, profile };
}

async function appointment(
  context: Awaited<ReturnType<typeof tenant>>,
  reference: string,
) {
  return prisma.appointment.create({
    data: {
      organizationId: context.organization.id,
      clinicId: context.clinic.id,
      doctorId: context.doctor.id,
      patientProfileId: context.profile.id,
      publicReference: reference,
      startsAt: new Date('2030-01-01T08:00:00.000Z'),
      durationMinutes: 30,
      feeIqd: 25000,
    },
  });
}

describe('real PostgreSQL foundation', () => {
  beforeEach(async () => {
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE organizations, users, idempotency_records, outbox_events CASCADE`,
    );
  });
  afterAll(() => prisma.$disconnect());

  it('creates tenant records with UUIDv7 and UTC timestamps', async () => {
    const context = await tenant('alpha');
    expect(context.organization.id[14]).toBe('7');
    expect(context.organization.createdAt.toISOString()).toMatch(/Z$/);
    expect(context.clinic.organizationId).toBe(context.organization.id);
  });

  it('enforces clinic code uniqueness within an organization', async () => {
    const context = await tenant('clinic-code');
    await expect(
      prisma.clinic.create({
        data: {
          organizationId: context.organization.id,
          name: 'Another Fictional Clinic',
          code: context.clinic.code,
          timezone: 'Asia/Baghdad',
        },
      }),
    ).rejects.toThrow();
  });

  it('enforces fees, duration, references, memberships, and queue uniqueness', async () => {
    const context = await tenant('constraints');
    await expect(
      prisma.appointment.create({
        data: {
          organizationId: context.organization.id,
          clinicId: context.clinic.id,
          doctorId: context.doctor.id,
          patientProfileId: context.profile.id,
          publicReference: 'NEGATIVE',
          startsAt: new Date(),
          durationMinutes: 0,
          feeIqd: -1,
        },
      }),
    ).rejects.toThrow();
    const first = await appointment(context, 'APT-UNIQUE');
    await expect(appointment(context, 'APT-UNIQUE')).rejects.toThrow();
    await prisma.clinicMembership.create({
      data: {
        organizationId: context.organization.id,
        clinicId: context.clinic.id,
        userId: context.staffUser.id,
        role: 'receptionist',
      },
    });
    await expect(
      prisma.clinicMembership.create({
        data: {
          organizationId: context.organization.id,
          clinicId: context.clinic.id,
          userId: context.staffUser.id,
          role: 'receptionist',
        },
      }),
    ).rejects.toThrow();
    const session = await prisma.queueSession.create({
      data: {
        organizationId: context.organization.id,
        clinicId: context.clinic.id,
        doctorId: context.doctor.id,
        operationalDate: new Date('2030-01-01'),
      },
    });
    await expect(
      prisma.queueSession.create({
        data: {
          organizationId: context.organization.id,
          clinicId: context.clinic.id,
          doctorId: context.doctor.id,
          operationalDate: new Date('2030-01-01'),
        },
      }),
    ).rejects.toThrow();
    await prisma.queueEntry.create({
      data: {
        organizationId: context.organization.id,
        clinicId: context.clinic.id,
        queueSessionId: session.id,
        appointmentId: first.id,
        patientProfileId: context.profile.id,
        queueNumber: 1,
        position: 0,
        status: 'called',
      },
    });
    await expect(
      prisma.queueEntry.create({
        data: {
          organizationId: context.organization.id,
          clinicId: context.clinic.id,
          queueSessionId: session.id,
          patientProfileId: context.profile.id,
          queueNumber: 1,
          position: 1,
        },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.queueEntry.create({
        data: {
          organizationId: context.organization.id,
          clinicId: context.clinic.id,
          queueSessionId: session.id,
          patientProfileId: context.profile.id,
          queueNumber: 2,
          position: 1,
          status: 'inConsultation',
        },
      }),
    ).rejects.toThrow();
  });

  it('rejects cross-tenant doctor, patient, clinic, and queue relationships', async () => {
    const a = await tenant('tenant-a');
    const b = await tenant('tenant-b');
    await expect(
      prisma.clinicMembership.create({
        data: {
          organizationId: a.organization.id,
          clinicId: b.clinic.id,
          userId: a.staffUser.id,
          role: 'receptionist',
        },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.appointment.create({
        data: {
          organizationId: b.organization.id,
          clinicId: b.clinic.id,
          doctorId: a.doctor.id,
          patientProfileId: b.profile.id,
          publicReference: 'CROSS-DOCTOR',
          startsAt: new Date(),
          durationMinutes: 30,
          feeIqd: 1,
        },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.appointment.create({
        data: {
          organizationId: b.organization.id,
          clinicId: b.clinic.id,
          doctorId: b.doctor.id,
          patientProfileId: a.profile.id,
          publicReference: 'CROSS-PROFILE',
          startsAt: new Date(),
          durationMinutes: 30,
          feeIqd: 1,
        },
      }),
    ).rejects.toThrow();
    const sessionA = await prisma.queueSession.create({
      data: {
        organizationId: a.organization.id,
        clinicId: a.clinic.id,
        doctorId: a.doctor.id,
        operationalDate: new Date('2031-01-01'),
      },
    });
    await expect(
      prisma.queueEntry.create({
        data: {
          organizationId: b.organization.id,
          clinicId: b.clinic.id,
          queueSessionId: sessionA.id,
          patientProfileId: b.profile.id,
          queueNumber: 1,
          position: 0,
        },
      }),
    ).rejects.toThrow();
  });

  it('persists security, audit, and outbox foundations with uniqueness', async () => {
    const context = await tenant('foundation');
    const family = await prisma.sessionFamily.create({
      data: {
        userId: context.staffUser.id,
        role: 'platformAdministrator',
        expiresAt: new Date('2035-01-01'),
      },
    });
    await prisma.refreshSession.create({
      data: {
        userId: context.staffUser.id,
        deviceId: 'fictional-device',
        tokenHash: 'fictional-hash',
        familyId: family.id,
        platform: 'test',
        expiresAt: new Date('2035-01-01'),
      },
    });
    await expect(
      prisma.refreshSession.create({
        data: {
          userId: context.staffUser.id,
          deviceId: 'other',
          tokenHash: 'fictional-hash',
          familyId: family.id,
          platform: 'test',
          expiresAt: new Date('2035-01-01'),
        },
      }),
    ).rejects.toThrow();
    await prisma.idempotencyRecord.create({
      data: {
        actorId: context.staffUser.id,
        scope: 'verification',
        key: 'one',
        requestHash: 'hash',
        expiresAt: new Date('2035-01-01'),
      },
    });
    await expect(
      prisma.idempotencyRecord.create({
        data: {
          actorId: context.staffUser.id,
          scope: 'verification',
          key: 'one',
          requestHash: 'hash-2',
          expiresAt: new Date('2035-01-01'),
        },
      }),
    ).rejects.toThrow();
    const audit = await prisma.auditEvent.create({
      data: {
        organizationId: context.organization.id,
        actorUserId: context.staffUser.id,
        action: 'foundation.verify',
        targetType: 'organization',
        targetId: context.organization.id,
        outcome: 'succeeded',
        requestId: 'fictional-request',
        occurredAt: new Date(),
      },
    });
    const outbox = await prisma.outboxEvent.create({
      data: {
        aggregateType: 'organization',
        aggregateId: context.organization.id,
        eventType: 'foundation.verified',
        payload: { fictional: true },
        occurredAt: new Date(),
      },
    });
    expect(audit.id[14]).toBe('7');
    expect(outbox.id[14]).toBe('7');
  });

  it('contains every migrated table, reviewed index, and custom constraint', async () => {
    const tables = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`SELECT count(*)::bigint AS count FROM information_schema.tables WHERE table_schema = 'public'`;
    const indexes = await prisma.$queryRaw<
      Array<{ indexname: string }>
    >`SELECT indexname FROM pg_indexes WHERE schemaname = 'public'`;
    const constraints = await prisma.$queryRaw<
      Array<{ conname: string }>
    >`SELECT conname FROM pg_constraint`;
    expect(Number(tables[0]?.count)).toBeGreaterThanOrEqual(20);
    expect(
      indexes.some(
        (item) => item.indexname === 'queue_entries_single_active_consultation',
      ),
    ).toBe(true);
    expect(
      constraints.some(
        (item) => item.conname === 'appointments_fee_iqd_non_negative',
      ),
    ).toBe(true);
  });
});
