/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { createApplication } from '../../src/main';
import { loadConfiguration } from '../../src/config/environment';
import { hashPassword } from '../../src/modules/identity/domain/security';

const url = process.env.TEST_DATABASE_URL!;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});
const suffix = `${Date.now()}`;
const configuration = loadConfiguration({
  SAXLEM_BACKEND_ENV: 'development',
  DATABASE_URL: url,
  ACCESS_TOKEN_SECRET: 'schedule-access-secret-at-least-32-characters',
  REFRESH_TOKEN_SECRET: 'schedule-refresh-secret-at-least-32-characters',
  OTP_SECRET: 'schedule-otp-secret-at-least-32-characters',
  AUDIT_HASH_SECRET: 'schedule-audit-secret-at-least-32-characters',
  OPENAPI_ENABLED: 'false',
});

describe('doctor schedule foundation API', () => {
  afterAll(() => prisma.$disconnect());

  it('enforces timezone, precedence, authorization, tenancy, projections, and staff audit', async () => {
    const tenantA = await createTenant('a');
    const tenantB = await createTenant('b');
    const doctorA = await createDoctor(tenantA, 'ScheduleA');
    const doctorB = await createDoctor(tenantB, 'ScheduleB');
    await seedSchedule(tenantA, doctorA.id);
    await seedSchedule(tenantB, doctorB.id);
    const app = await createApplication(configuration);
    await app.init();
    const patientToken = await authenticatePatient(
      app.getHttpServer(),
      '+9647500000113',
    );
    const staffToken = await authenticateStaff(
      app.getHttpServer(),
      tenantA.email,
      tenantA.password,
    );
    const administrator = await createPlatformAdministrator(tenantA);
    const administratorToken = await authenticateStaff(
      app.getHttpServer(),
      administrator.email,
      administrator.password,
    );
    const api = () => request(app.getHttpServer());
    const at = '2026-07-20T06:30:00.000Z';

    const patientAuditBefore = await prisma.auditEvent.count({
      where: { action: { in: ['schedule.viewed', 'availability.viewed'] } },
    });
    await api()
      .get(`/api/v1/doctors/${doctorA.id}/schedule`)
      .set('Authorization', `Bearer ${patientToken}`)
      .query({ clinicId: tenantA.clinicId })
      .expect(403);
    expect(
      await prisma.auditEvent.count({
        where: { action: { in: ['schedule.viewed', 'availability.viewed'] } },
      }),
    ).toBe(patientAuditBefore);

    await api()
      .get(`/api/v1/doctors/${doctorA.id}/availability`)
      .set('Authorization', `Bearer ${patientToken}`)
      .query({ clinicId: tenantA.clinicId, at })
      .expect(200)
      .expect((response) =>
        expect(response.body.clinics[0]).toMatchObject({
          localDate: '2026-07-20',
          status: 'workingToday',
          isWorkingNow: true,
        }),
      );
    const publicAvailability = await api()
      .get(`/api/v1/doctors/${doctorA.id}/availability`)
      .set('Authorization', `Bearer ${patientToken}`)
      .query({ clinicId: tenantA.clinicId, at })
      .expect(200);
    for (const privateField of [
      'breakPeriods',
      'workingPeriods',
      'holidayName',
      'precedenceSource',
      'leave',
      'exceptions',
    ])
      expect(JSON.stringify(publicAvailability.body)).not.toContain(
        privateField,
      );
    await api()
      .get(`/api/v1/clinics/${tenantA.clinicId}/hours`)
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(403);

    const range = {
      startsAt: new Date('2026-07-20T05:00:00.000Z'),
      endsAt: new Date('2026-07-20T10:00:00.000Z'),
    };
    const leave = await prisma.doctorLeave.create({
      data: { ...tenantScope(tenantA, doctorA.id), ...range },
    });
    const holiday = await prisma.doctorHoliday.create({
      data: {
        ...tenantScope(tenantA, doctorA.id),
        ...range,
        name: 'Foundation Holiday',
      },
    });
    const exception = await prisma.doctorScheduleException.create({
      data: {
        ...tenantScope(tenantA, doctorA.id),
        ...range,
        kind: 'working',
      },
    });
    await expectAvailability(
      api,
      patientToken,
      doctorA.id,
      tenantA.clinicId,
      at,
      {
        status: 'workingToday',
        isWorkingNow: true,
      },
    );
    await prisma.doctorScheduleException.update({
      where: { id: exception.id },
      data: { status: 'inactive' },
    });
    await expectAvailability(
      api,
      patientToken,
      doctorA.id,
      tenantA.clinicId,
      at,
      {
        status: 'unavailable',
        isWorkingNow: false,
      },
    );
    await prisma.doctorLeave.update({
      where: { id: leave.id },
      data: { status: 'inactive' },
    });
    await expectAvailability(
      api,
      patientToken,
      doctorA.id,
      tenantA.clinicId,
      at,
      {
        status: 'unavailable',
        isWorkingNow: false,
      },
    );
    await prisma.doctorHoliday.update({
      where: { id: holiday.id },
      data: { status: 'inactive' },
    });

    await api()
      .get(`/api/v1/doctors/${doctorB.id}/schedule`)
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(404);
    await api()
      .get(`/api/v1/clinics/${tenantB.clinicId}/hours`)
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(403);
    await api()
      .get(`/api/v1/doctors/${doctorA.id}/schedule`)
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(200);
    await api()
      .get(`/api/v1/doctors/${doctorA.id}/availability`)
      .set('Authorization', `Bearer ${staffToken}`)
      .query({ at })
      .expect(200);
    await api()
      .get(`/api/v1/clinics/${tenantA.clinicId}/hours`)
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(403);
    expect(
      (
        await prisma.auditEvent.findMany({
          where: {
            actorUserId: tenantA.userId,
            action: { in: ['schedule.viewed', 'availability.viewed'] },
          },
          orderBy: { occurredAt: 'asc' },
        })
      ).map((event) => event.action),
    ).toEqual(['schedule.viewed', 'availability.viewed']);

    await api()
      .get(`/api/v1/doctors/${doctorB.id}/schedule`)
      .set('Authorization', `Bearer ${administratorToken}`)
      .expect(200);
    await api()
      .post(`/api/v1/doctors/${doctorA.id}/schedule`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({})
      .expect(404);
    await app.close();
  }, 120_000);

  it('rejects invalid periods, overlaps, ownership, timezone, and inactive-doctor schedules', async () => {
    const tenantA = await createTenant('constraints-a');
    const tenantB = await createTenant('constraints-b');
    const doctor = await createDoctor(tenantA, 'ConstraintSchedule');
    await seedSchedule(tenantA, doctor.id);
    const secondClinic = await prisma.clinic.create({
      data: {
        organizationId: tenantA.organizationId,
        name: 'Second Schedule Clinic',
        code: `schedule-second-${suffix}`,
        timezone: 'Asia/Baghdad',
      },
    });
    await prisma.doctorClinicAssignment.create({
      data: {
        organizationId: tenantA.organizationId,
        clinicId: secondClinic.id,
        doctorId: doctor.id,
      },
    });
    await prisma.clinicWorkingHours.create({
      data: {
        organizationId: tenantA.organizationId,
        clinicId: secondClinic.id,
        weekday: 1,
        opensMinute: 480,
        closesMinute: 1020,
      },
    });
    const otherDoctor = await createDoctor(tenantA, 'IndependentDoctor');
    await expect(
      prisma.doctorWeeklySchedule.create({
        data: {
          ...tenantScope(tenantA, otherDoctor.id),
          weekday: 1,
          startsMinute: 600,
          endsMinute: 700,
        },
      }),
    ).resolves.toBeDefined();
    await expect(
      prisma.doctorWeeklySchedule.create({
        data: {
          ...tenantScope(tenantA, doctor.id),
          weekday: 1,
          startsMinute: 600,
          endsMinute: 700,
        },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.doctorWeeklySchedule.create({
        data: {
          organizationId: tenantA.organizationId,
          clinicId: secondClinic.id,
          doctorId: doctor.id,
          weekday: 1,
          startsMinute: 600,
          endsMinute: 700,
        },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.doctorWeeklySchedule.create({
        data: {
          ...tenantScope(tenantA, doctor.id),
          weekday: 1,
          startsMinute: 960,
          endsMinute: 1020,
        },
      }),
    ).resolves.toBeDefined();
    await expect(
      prisma.doctorWeeklySchedule.create({
        data: {
          ...tenantScope(tenantA, doctor.id),
          weekday: 1,
          startsMinute: 600,
          endsMinute: 700,
          status: 'inactive',
        },
      }),
    ).resolves.toBeDefined();
    await expect(
      prisma.doctorBreak.create({
        data: {
          ...tenantScope(tenantA, doctor.id),
          weekday: 1,
          startsMinute: 500,
          endsMinute: 510,
        },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.doctorLeave.create({
        data: {
          ...tenantScope(tenantA, doctor.id),
          startsAt: new Date('2026-07-21T10:00:00.000Z'),
          endsAt: new Date('2026-07-21T09:00:00.000Z'),
        },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.doctorWeeklySchedule.create({
        data: {
          organizationId: tenantB.organizationId,
          clinicId: tenantB.clinicId,
          doctorId: doctor.id,
          weekday: 2,
          startsMinute: 600,
          endsMinute: 700,
        },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.clinic.create({
        data: {
          organizationId: tenantA.organizationId,
          name: 'Invalid timezone',
          code: `invalid-timezone-${suffix}`,
          timezone: 'Iraq/Invalid',
        },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.doctor.update({
        where: { id: doctor.id },
        data: { status: 'inactive' },
      }),
    ).rejects.toThrow();
    const hours = await prisma.clinicWorkingHours.findFirstOrThrow({
      where: { clinicId: tenantA.clinicId, status: 'active' },
    });
    await expect(
      prisma.clinicWorkingHours.update({
        where: { id: hours.id },
        data: { opensMinute: 600 },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.clinicWorkingHours.update({
        where: { id: hours.id },
        data: { status: 'inactive' },
      }),
    ).rejects.toThrow();
    const weekly = await prisma.doctorWeeklySchedule.findFirstOrThrow({
      where: {
        clinicId: tenantA.clinicId,
        doctorId: doctor.id,
        startsMinute: 540,
        status: 'active',
      },
    });
    await expect(
      prisma.doctorWeeklySchedule.update({
        where: { id: weekly.id },
        data: { endsMinute: 700 },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.doctorWeeklySchedule.update({
        where: { id: weekly.id },
        data: { status: 'inactive' },
      }),
    ).rejects.toThrow();
    const holidayRange = {
      startsAt: new Date('2026-08-01T08:00:00.000Z'),
      endsAt: new Date('2026-08-01T10:00:00.000Z'),
    };
    await prisma.doctorHoliday.create({
      data: {
        ...tenantScope(tenantA, doctor.id),
        ...holidayRange,
        name: 'First holiday',
      },
    });
    await expect(
      prisma.doctorHoliday.create({
        data: {
          ...tenantScope(tenantA, doctor.id),
          startsAt: new Date('2026-08-01T09:00:00.000Z'),
          endsAt: new Date('2026-08-01T11:00:00.000Z'),
          name: 'Overlapping holiday',
        },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.doctorHoliday.create({
        data: {
          organizationId: tenantA.organizationId,
          clinicId: secondClinic.id,
          doctorId: doctor.id,
          startsAt: new Date('2026-08-01T09:00:00.000Z'),
          endsAt: new Date('2026-08-01T11:00:00.000Z'),
          name: 'Independent clinic holiday',
        },
      }),
    ).resolves.toBeDefined();
  });

  it('returns every temporal record in the bounded window beyond the former cap', async () => {
    const tenant = await createTenant('complete-window');
    const doctor = await createDoctor(tenant, 'CompleteWindow');
    const base = new Date('2026-08-01T00:00:00.000Z').getTime();
    await prisma.doctorHoliday.createMany({
      data: Array.from({ length: 1001 }, (_, index) => ({
        ...tenantScope(tenant, doctor.id),
        name: `Holiday ${index}`,
        startsAt: new Date(base + index * 120_000),
        endsAt: new Date(base + index * 120_000 + 60_000),
      })),
    });
    const app = await createApplication(configuration);
    await app.init();
    const token = await authenticateStaff(
      app.getHttpServer(),
      tenant.email,
      tenant.password,
    );
    await request(app.getHttpServer())
      .get(`/api/v1/doctors/${doctor.id}/schedule`)
      .set('Authorization', `Bearer ${token}`)
      .query({ at: '2026-08-02T00:00:00.000Z' })
      .expect(200)
      .expect((response) =>
        expect(response.body.clinics[0].holidays).toHaveLength(1001),
      );
    await app.close();
  }, 120_000);
});

async function createTenant(label: string) {
  const organization = await prisma.organization.create({
    data: { name: `Schedule ${label} ${suffix}` },
  });
  const clinic = await prisma.clinic.create({
    data: {
      organizationId: organization.id,
      name: `Schedule Clinic ${label}`,
      code: `schedule-${label}-${suffix}`,
      timezone: 'Asia/Baghdad',
    },
  });
  const email = `schedule-${label}-${suffix}@example.invalid`;
  const password = 'Fictional-Schedule-Password-2026!';
  const user = await prisma.user.create({
    data: {
      staffAccount: {
        create: { email, passwordHash: await hashPassword(password) },
      },
      roles: {
        create: {
          role: 'receptionist',
          organizationId: organization.id,
          clinicId: clinic.id,
        },
      },
      memberships: {
        create: {
          role: 'receptionist',
          organizationId: organization.id,
          clinicId: clinic.id,
        },
      },
    },
  });
  return {
    organizationId: organization.id,
    clinicId: clinic.id,
    email,
    password,
    userId: user.id,
  };
}

async function createDoctor(
  tenant: Awaited<ReturnType<typeof createTenant>>,
  name: string,
) {
  const specialty = await prisma.specialty.create({
    data: {
      code: `${name.toLowerCase()}-${suffix}`,
      displayName: `${name} Medicine`,
    },
  });
  const staff = await prisma.user.create({
    data: {
      staffAccount: {
        create: { email: `${name.toLowerCase()}-${suffix}@example.invalid` },
      },
    },
    include: { staffAccount: true },
  });
  return prisma.$transaction(async (transaction) => {
    const doctor = await transaction.doctor.create({
      data: {
        organizationId: tenant.organizationId,
        staffAccountId: staff.staffAccount!.id,
        firstName: name,
        lastName: 'Test',
        displayName: `Dr. ${name} Test`,
        gender: 'unspecified',
        licenseNumber: `KRI-${name}-${suffix}`,
        yearsOfExperience: 10,
        languages: ['english'],
      },
    });
    await transaction.doctorClinicAssignment.create({
      data: tenantScope(tenant, doctor.id),
    });
    await transaction.doctorSpecialtyAssignment.create({
      data: { doctorId: doctor.id, specialtyId: specialty.id, isPrimary: true },
    });
    return doctor;
  });
}

async function seedSchedule(
  tenant: Awaited<ReturnType<typeof createTenant>>,
  doctorId: string,
) {
  await prisma.clinicWorkingHours.create({
    data: {
      organizationId: tenant.organizationId,
      clinicId: tenant.clinicId,
      weekday: 1,
      opensMinute: 480,
      closesMinute: 1020,
    },
  });
  await prisma.doctorWeeklySchedule.create({
    data: {
      ...tenantScope(tenant, doctorId),
      weekday: 1,
      startsMinute: 540,
      endsMinute: 960,
    },
  });
  await prisma.doctorBreak.create({
    data: {
      ...tenantScope(tenant, doctorId),
      weekday: 1,
      startsMinute: 720,
      endsMinute: 750,
    },
  });
}

function tenantScope(
  tenant: { organizationId: string; clinicId: string },
  doctorId: string,
) {
  return {
    organizationId: tenant.organizationId,
    clinicId: tenant.clinicId,
    doctorId,
  };
}

async function authenticatePatient(
  server: Parameters<typeof request>[0],
  phone: string,
) {
  const challenge = await request(server)
    .post('/api/v1/auth/request-otp')
    .send({ phone })
    .expect(202);
  const verified = await request(server)
    .post('/api/v1/auth/verify-otp')
    .send({
      challengeId: challenge.body.challengeId,
      otp: challenge.body.developmentOtp,
      deviceId: 'schedule-patient',
      platform: 'android',
    })
    .expect(200);
  return verified.body.accessToken as string;
}

async function authenticateStaff(
  server: Parameters<typeof request>[0],
  email: string,
  password: string,
) {
  const response = await request(server)
    .post('/api/v1/auth/login')
    .send({ email, password, deviceId: 'schedule-staff', platform: 'web' })
    .expect(200);
  return response.body.accessToken as string;
}

async function createPlatformAdministrator(
  tenant: Awaited<ReturnType<typeof createTenant>>,
) {
  const email = `schedule-platform-${suffix}@example.invalid`;
  const password = 'Fictional-Platform-Schedule-Password-2026!';
  await prisma.user.create({
    data: {
      staffAccount: {
        create: { email, passwordHash: await hashPassword(password) },
      },
      roles: { create: { role: 'platformAdministrator' } },
      memberships: {
        create: {
          role: 'platformAdministrator',
          organizationId: tenant.organizationId,
          clinicId: tenant.clinicId,
        },
      },
    },
  });
  return { email, password };
}

async function expectAvailability(
  api: () => ReturnType<typeof request>,
  token: string,
  doctorId: string,
  clinicId: string,
  at: string,
  expected: Record<string, unknown>,
) {
  await api()
    .get(`/api/v1/doctors/${doctorId}/availability`)
    .set('Authorization', `Bearer ${token}`)
    .query({ clinicId, at })
    .expect(200)
    .expect((response) =>
      expect(response.body.clinics[0]).toMatchObject(expected),
    );
}
