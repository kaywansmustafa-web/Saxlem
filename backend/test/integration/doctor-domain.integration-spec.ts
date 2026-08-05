/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type DoctorStatus } from '@prisma/client';
import request from 'supertest';
import { createApplication } from '../../src/main';
import { loadConfiguration } from '../../src/config/environment';
import { hashPassword } from '../../src/modules/identity/domain/security';

const url = process.env.TEST_DATABASE_URL!;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});
const configuration = loadConfiguration({
  SAXLEM_BACKEND_ENV: 'development',
  DATABASE_URL: url,
  ACCESS_TOKEN_SECRET: 'doctor-access-secret-at-least-32-characters',
  REFRESH_TOKEN_SECRET: 'doctor-refresh-secret-at-least-32-characters',
  OTP_SECRET: 'doctor-otp-secret-at-least-32-characters',
  AUDIT_HASH_SECRET: 'doctor-audit-secret-at-least-32-characters',
  OPENAPI_ENABLED: 'false',
});
const suffix = `${Date.now()}`;

describe('doctor domain API', () => {
  afterAll(() => prisma.$disconnect());

  it('enforces visibility, tenant isolation, filters, pagination, read-only routes, and staff-only audit', async () => {
    const specialty = await prisma.specialty.create({
      data: { code: `sprint-${suffix}`, displayName: 'Sprint Cardiology' },
    });
    const otherSpecialty = await prisma.specialty.create({
      data: { code: `inactive-${suffix}`, displayName: 'Sprint Neurology' },
    });
    const tenantA = await createTenant('a');
    const tenantB = await createTenant('b');
    const activeA = await createDoctor(
      tenantA,
      specialty.id,
      'Shilan',
      'female',
      'active',
      ['badiniKurdish', 'english'],
      12,
      true,
    );
    const inactiveA = await createDoctor(
      tenantA,
      otherSpecialty.id,
      'Baran',
      'male',
      'inactive',
      ['arabic'],
      5,
      false,
    );
    const archivedA = await createDoctor(
      tenantA,
      specialty.id,
      'Hidden',
      'unspecified',
      'archived',
      ['english'],
      20,
      false,
    );
    const activeB = await createDoctor(
      tenantB,
      specialty.id,
      'Dara',
      'male',
      'active',
      ['badiniKurdish'],
      15,
      true,
    );
    const inactivePrimary = await prisma.specialty.create({
      data: {
        code: `inactive-primary-${suffix}`,
        displayName: 'Retired Specialty',
        status: 'inactive',
      },
    });
    await prisma.doctorSpecialtyAssignment.update({
      where: {
        doctorId_specialtyId: {
          doctorId: activeA.id,
          specialtyId: specialty.id,
        },
      },
      data: { isPrimary: false },
    });
    await prisma.doctorSpecialtyAssignment.create({
      data: {
        doctorId: activeA.id,
        specialtyId: inactivePrimary.id,
        isPrimary: true,
      },
    });
    const inactiveClinic = await prisma.clinic.create({
      data: {
        organizationId: tenantA.organizationId,
        name: 'Inactive Clinic',
        code: `inactive-clinic-${suffix}`,
        timezone: 'Asia/Baghdad',
        status: 'inactive',
      },
    });
    await prisma.doctorClinicAssignment.create({
      data: {
        organizationId: tenantA.organizationId,
        clinicId: inactiveClinic.id,
        doctorId: activeA.id,
      },
    });
    const inactiveAssignmentClinic = await prisma.clinic.create({
      data: {
        organizationId: tenantA.organizationId,
        name: 'Inactive Assignment Clinic',
        code: `inactive-assignment-${suffix}`,
        timezone: 'Asia/Baghdad',
      },
    });
    await prisma.doctorClinicAssignment.create({
      data: {
        organizationId: tenantA.organizationId,
        clinicId: inactiveAssignmentClinic.id,
        doctorId: activeA.id,
        status: 'inactive',
      },
    });
    const inactiveAssignmentOnly = await createDoctor(
      tenantA,
      specialty.id,
      'InactiveAssignmentOnly',
      'unspecified',
      'active',
      ['turkish'],
      30,
      true,
    );
    await prisma.doctorClinicAssignment.update({
      where: {
        organizationId_clinicId_doctorId: {
          organizationId: tenantA.organizationId,
          clinicId: tenantA.clinicId,
          doctorId: inactiveAssignmentOnly.id,
        },
      },
      data: { status: 'inactive' },
    });
    const inactiveClinicTenant = await createTenant('inactive-clinic-only');
    await prisma.clinic.update({
      where: { id: inactiveClinicTenant.clinicId },
      data: { status: 'inactive' },
    });
    const inactiveClinicOnly = await createDoctor(
      inactiveClinicTenant,
      specialty.id,
      'ClosedClinic',
      'female',
      'active',
      ['english'],
      7,
      false,
    );
    const inactiveOrganizationTenant = await createTenant('inactive-org');
    const inactiveOrganizationDoctor = await createDoctor(
      inactiveOrganizationTenant,
      specialty.id,
      'ClosedOrganization',
      'male',
      'active',
      ['english'],
      9,
      false,
    );
    await prisma.organization.update({
      where: { id: inactiveOrganizationTenant.organizationId },
      data: { status: 'inactive' },
    });
    const retiredOnlySpecialty = await prisma.specialty.create({
      data: {
        code: `retired-only-${suffix}`,
        displayName: 'Retired Only',
      },
    });
    const retiredOnlyDoctor = await createDoctor(
      tenantA,
      retiredOnlySpecialty.id,
      'RetiredOnly',
      'female',
      'active',
      ['english'],
      6,
      false,
    );
    await prisma.specialty.update({
      where: { id: retiredOnlySpecialty.id },
      data: { status: 'inactive' },
    });
    const doctorCredentials = await enableDoctorLogin(activeA.id, tenantA);
    const managerCredentials = await createStaffRole(tenantA, 'clinicManager');
    const administratorCredentials = await createPlatformAdministrator(tenantA);
    const emptyTenant = await createTenant('empty-options');
    const app = await createApplication(configuration);
    await app.init();
    const patientToken = await authenticatePatient(
      app.getHttpServer(),
      '+9647500000008',
    );
    const staffToken = await authenticateReceptionist(
      app.getHttpServer(),
      tenantA.email,
      tenantA.password,
    );
    const doctorToken = await authenticateReceptionist(
      app.getHttpServer(),
      doctorCredentials.email,
      doctorCredentials.password,
    );
    const managerToken = await authenticateReceptionist(
      app.getHttpServer(),
      managerCredentials.email,
      managerCredentials.password,
    );
    const administratorToken = await authenticateReceptionist(
      app.getHttpServer(),
      administratorCredentials.email,
      administratorCredentials.password,
    );
    const emptyTenantToken = await authenticateReceptionist(
      app.getHttpServer(),
      emptyTenant.email,
      emptyTenant.password,
    );
    const api = () => request(app.getHttpServer());

    const publicPage = await api()
      .get('/api/v1/doctors')
      .set('Authorization', `Bearer ${patientToken}`)
      .query({
        specialty: specialty.code,
        language: 'badiniKurdish',
        minimumYearsOfExperience: 10,
        page: 1,
        pageSize: 1,
      })
      .expect(200);
    expect(publicPage.body).toMatchObject({
      page: 1,
      pageSize: 1,
      total: 2,
      totalPages: 2,
    });
    expect(publicPage.body.items).toHaveLength(1);
    expect(publicPage.body.items[0].clinics).toEqual([
      { id: tenantB.clinicId, name: 'Clinic b' },
    ]);
    expect(publicPage.body.items[0].specialty).toBe(specialty.displayName);
    expect(publicPage.body.items[0]).not.toHaveProperty('profilePhotoKey');
    expect(publicPage.body.items[0]).not.toHaveProperty('organizationId');
    expect(publicPage.body.items[0]).not.toHaveProperty('version');
    expect(publicPage.body.items[0]).not.toHaveProperty('createdAt');
    expect(
      publicPage.body.items.flatMap(
        (item: { clinics: Array<{ id: string }> }) =>
          item.clinics.map(({ id }) => id),
      ),
    ).not.toContain(inactiveAssignmentClinic.id);
    await api()
      .get(`/api/v1/doctors/${activeA.id}`)
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(200)
      .expect((response) =>
        expect(response.body.clinics).toEqual([
          { id: tenantA.clinicId, name: 'Clinic a' },
        ]),
      );
    await api()
      .get('/api/v1/doctors')
      .set('Authorization', `Bearer ${patientToken}`)
      .query({ clinicId: inactiveAssignmentClinic.id })
      .expect(200)
      .expect((response) => expect(response.body.total).toBe(0));
    await api()
      .get(`/api/v1/doctors/${inactiveAssignmentOnly.id}`)
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(404);
    await api()
      .get(`/api/v1/doctors/${activeA.id}/availability`)
      .set('Authorization', `Bearer ${patientToken}`)
      .query({ clinicId: inactiveAssignmentClinic.id })
      .expect(404);
    await api()
      .get(`/api/v1/doctors/${inactiveAssignmentOnly.id}/availability`)
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(404);
    for (const name of [' ', '   '])
      await api()
        .get('/api/v1/doctors')
        .set('Authorization', `Bearer ${patientToken}`)
        .query({ name })
        .expect(400);
    await api()
      .get('/api/v1/doctors')
      .set('Authorization', `Bearer ${patientToken}`)
      .query({ name: '  Shilan  ', specialty: specialty.code })
      .expect(200)
      .expect((response) => expect(response.body.total).toBe(1));
    await api()
      .get('/api/v1/doctors')
      .set('Authorization', `Bearer ${patientToken}`)
      .query({ name: 'ژیان', specialty: specialty.code })
      .expect(200);
    await api()
      .get('/api/v1/doctors')
      .set('Authorization', `Bearer ${patientToken}`)
      .query({ name: 'x'.repeat(121) })
      .expect(400);
    await api()
      .get('/api/v1/doctors')
      .set('Authorization', `Bearer ${patientToken}`)
      .query({ page: 10000, pageSize: 100, specialty: specialty.code })
      .expect(200);
    for (const page of ['10001', '9007199254740991'])
      await api()
        .get('/api/v1/doctors')
        .set('Authorization', `Bearer ${patientToken}`)
        .query({ page })
        .expect(400);
    await api()
      .get('/api/v1/doctors')
      .set('Authorization', `Bearer ${patientToken}`)
      .query({ page: 10001 })
      .expect(400)
      .expect((response) =>
        expect(response.body).toMatchObject({
          error: {
            code: 'VALIDATION_FAILED',
            retryable: false,
            fieldErrors: expect.any(Array),
          },
        }),
      );
    await api()
      .get('/api/v1/doctors')
      .set('Authorization', `Bearer ${patientToken}`)
      .query({ status: 'inactive' })
      .expect(403);
    await api()
      .get(`/api/v1/doctors/${inactiveA.id}`)
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(404);
    await api()
      .get(`/api/v1/doctors/${archivedA.id}`)
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(404);
    await api()
      .get(`/api/v1/doctors/${inactiveClinicOnly.id}`)
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(404);
    await api()
      .get(`/api/v1/doctors/${inactiveOrganizationDoctor.id}`)
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(404);
    await api()
      .get(`/api/v1/doctors/${retiredOnlyDoctor.id}`)
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(404);
    const publicAuditBefore = await prisma.auditEvent.count({
      where: { action: { startsWith: 'doctor.' }, actorUserId: { not: null } },
    });
    await api()
      .get(`/api/v1/doctors/${activeB.id}/profile`)
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(200)
      .expect((response) =>
        expect(response.body).toMatchObject({
          fullName: 'Dr. Dara Test',
          specialty: specialty.displayName,
          profileImageUrl: null,
        }),
      );
    expect(
      await prisma.auditEvent.count({
        where: {
          action: { startsWith: 'doctor.' },
          actorUserId: { not: null },
        },
      }),
    ).toBe(publicAuditBefore);

    await api().get('/api/v1/doctors/discovery-options').expect(401);
    await api()
      .get('/api/v1/doctors/discovery-options')
      .set('Authorization', `Bearer ${patientToken}`)
      .query({ organizationId: tenantA.organizationId })
      .expect(400);
    const patientOptions = await api()
      .get('/api/v1/doctors/discovery-options')
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(200);
    expect(patientOptions.body.specialties).not.toContainEqual(
      expect.objectContaining({ code: otherSpecialty.code }),
    );
    expect(patientOptions.body.specialties).not.toContainEqual(
      expect.objectContaining({ code: retiredOnlySpecialty.code }),
    );
    expect(patientOptions.body.clinics).not.toContainEqual(
      expect.objectContaining({ id: inactiveAssignmentClinic.id }),
    );
    expect(new Set(patientOptions.body.languages).size).toBe(
      patientOptions.body.languages.length,
    );
    expect(patientOptions.body.languages).toEqual(
      [...patientOptions.body.languages].sort(),
    );
    expect(patientOptions.body.genders).toEqual(
      ['female', 'male', 'unspecified'].filter((gender) =>
        patientOptions.body.genders.includes(gender),
      ),
    );
    expect(patientOptions.body.experience).toEqual({
      minimum: expect.any(Number),
      maximum: expect.any(Number),
    });

    await api()
      .get('/api/v1/doctors/discovery-options')
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(200)
      .expect((response) =>
        expect(response.body).toEqual({
          specialties: [
            { code: specialty.code, displayName: specialty.displayName },
          ],
          clinics: [{ id: tenantA.clinicId, name: 'Clinic a' }],
          languages: ['badiniKurdish', 'english'],
          genders: ['female'],
          experience: { minimum: 12, maximum: 12 },
        }),
      );
    await api()
      .get('/api/v1/doctors/discovery-options')
      .set('Authorization', `Bearer ${emptyTenantToken}`)
      .expect(200)
      .expect((response) =>
        expect(response.body).toEqual({
          specialties: [],
          clinics: [],
          languages: [],
          genders: [],
          experience: { minimum: null, maximum: null },
        }),
      );

    const tenantPage = await api()
      .get('/api/v1/doctors')
      .set('Authorization', `Bearer ${staffToken}`)
      .query({ specialty: specialty.code, name: 'Shilan', gender: 'female' })
      .expect(200);
    expect(
      tenantPage.body.items.map((item: { id: string }) => item.id),
    ).toEqual([activeA.id]);
    expect(tenantPage.body.items[0].clinics).toEqual([
      { id: tenantA.clinicId, name: 'Clinic a' },
      {
        id: inactiveAssignmentClinic.id,
        name: 'Inactive Assignment Clinic',
      },
    ]);
    await api()
      .get('/api/v1/doctors')
      .set('Authorization', `Bearer ${staffToken}`)
      .query({ status: 'inactive', specialty: otherSpecialty.code })
      .expect(200)
      .expect((response) =>
        expect(
          response.body.items.map((item: { id: string }) => item.id),
        ).toEqual([inactiveA.id]),
      );
    await api()
      .get('/api/v1/doctors')
      .set('Authorization', `Bearer ${staffToken}`)
      .query({ clinicId: tenantB.clinicId })
      .expect(403);
    await api()
      .get(`/api/v1/doctors/${activeB.id}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(404);
    await api()
      .get(`/api/v1/doctors/${inactiveA.id}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(200);
    await api()
      .get(`/api/v1/doctors/${activeA.id}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(200);
    await api()
      .get(`/api/v1/doctors/${activeA.id}/profile`)
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(200);
    await api()
      .get(`/api/v1/doctors/${activeA.id}/specialties`)
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(200)
      .expect((response) =>
        expect(response.body).toEqual([
          {
            id: specialty.id,
            code: specialty.code,
            displayName: specialty.displayName,
            isPrimary: true,
          },
        ]),
      );
    await api()
      .get(`/api/v1/doctors/${activeA.id}/availability`)
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(200)
      .expect((response) =>
        expect(response.body.clinics[0]).toMatchObject({
          status: 'closedToday',
        }),
      );
    expect(
      (
        await prisma.auditEvent.findMany({
          where: {
            actorUserId: tenantA.userId,
            OR: [
              { action: { startsWith: 'doctor.' } },
              { action: 'availability.viewed' },
            ],
            targetId: activeA.id,
          },
          orderBy: { occurredAt: 'asc' },
        })
      ).map((event) => event.action),
    ).toEqual([
      'doctor.details.viewed',
      'doctor.profile.viewed',
      'doctor.specialties.viewed',
      'availability.viewed',
    ]);
    await api()
      .post('/api/v1/doctors')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({})
      .expect(404);
    for (const token of [doctorToken, managerToken]) {
      await api()
        .get('/api/v1/doctors')
        .set('Authorization', `Bearer ${token}`)
        .query({ specialty: specialty.code })
        .expect(200)
        .expect((response) =>
          expect(
            response.body.items.map((item: { id: string }) => item.id),
          ).toEqual([inactiveAssignmentOnly.id, activeA.id]),
        );
      await api()
        .get(`/api/v1/doctors/${activeB.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
      await api()
        .get(`/api/v1/doctors/${inactiveA.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    }
    await api()
      .get('/api/v1/doctors')
      .set('Authorization', `Bearer ${administratorToken}`)
      .query({ specialty: specialty.code })
      .expect(200)
      .expect((response) =>
        expect(
          response.body.items.map((item: { id: string }) => item.id),
        ).toEqual(expect.arrayContaining([activeA.id, activeB.id])),
      );
    await api()
      .get(`/api/v1/doctors/${activeB.id}`)
      .set('Authorization', `Bearer ${administratorToken}`)
      .expect(200);
    await api()
      .get(`/api/v1/doctors/${inactiveClinicOnly.id}`)
      .set('Authorization', `Bearer ${administratorToken}`)
      .expect(404);
    await app.close();
  }, 120_000);

  it('enforces database invariants for clinic ownership, license uniqueness, availability, and soft deletion', async () => {
    const specialty = await prisma.specialty.create({
      data: { code: `invariant-${suffix}`, displayName: 'Invariant Medicine' },
    });
    const tenantA = await createTenant('constraint-a');
    const tenantB = await createTenant('constraint-b');
    const doctor = await createDoctor(
      tenantA,
      specialty.id,
      'Constraint',
      'female',
      'active',
      ['english'],
      8,
      false,
    );
    await expect(
      prisma.doctorClinicAssignment.create({
        data: {
          organizationId: tenantB.organizationId,
          clinicId: tenantB.clinicId,
          doctorId: doctor.id,
        },
      }),
    ).rejects.toThrow();
    await expect(
      createDoctor(
        tenantA,
        specialty.id,
        'Duplicate',
        'male',
        'active',
        ['english'],
        3,
        false,
        doctor.licenseNumber,
      ),
    ).rejects.toThrow();
    await prisma.doctor.update({
      where: { id: doctor.id },
      data: { status: 'inactive' },
    });
    await expect(
      prisma.doctorAvailabilityFoundation.create({
        data: {
          doctorId: doctor.id,
          status: 'available',
          acceptingNewPatients: true,
        },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.doctor.delete({ where: { id: doctor.id } }),
    ).rejects.toThrow();
  });
});

async function createTenant(label: string) {
  const organization = await prisma.organization.create({
    data: { name: `Doctor Domain ${label} ${suffix}` },
  });
  const clinic = await prisma.clinic.create({
    data: {
      organizationId: organization.id,
      name: `Clinic ${label}`,
      code: `doctor-${label}-${suffix}`,
      timezone: 'Asia/Baghdad',
    },
  });
  const email = `reception-${label}-${suffix}@example.invalid`;
  const password = 'Fictional-Receptionist-Password-2026!';
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
          organizationId: organization.id,
          clinicId: clinic.id,
          role: 'receptionist',
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
  specialtyId: string,
  firstName: string,
  gender: 'female' | 'male' | 'unspecified',
  status: DoctorStatus,
  languages: string[],
  yearsOfExperience: number,
  available: boolean,
  licenseNumber = `KRI-${firstName}-${suffix}`,
) {
  const staff = await prisma.user.create({
    data: {
      staffAccount: {
        create: {
          email: `doctor-${firstName.toLowerCase()}-${Math.random()}@example.invalid`,
        },
      },
    },
    include: { staffAccount: true },
  });
  return prisma.$transaction(async (transaction) => {
    const doctor = await transaction.doctor.create({
      data: {
        organizationId: tenant.organizationId,
        staffAccountId: staff.staffAccount!.id,
        firstName,
        lastName: 'Test',
        displayName: `Dr. ${firstName} Test`,
        gender,
        status,
        licenseNumber,
        yearsOfExperience,
        biography:
          'A fictional professional biography used for integration testing.',
        languages,
      },
    });
    await transaction.doctorClinicAssignment.create({
      data: {
        organizationId: tenant.organizationId,
        clinicId: tenant.clinicId,
        doctorId: doctor.id,
      },
    });
    await transaction.doctorSpecialtyAssignment.create({
      data: { doctorId: doctor.id, specialtyId, isPrimary: true },
    });
    await transaction.doctorAvailabilityFoundation.create({
      data: {
        doctorId: doctor.id,
        status: available ? 'available' : 'unavailable',
        acceptingNewPatients: available,
        nextAvailableAt: available ? new Date(Date.now() + 86400000) : null,
      },
    });
    return doctor;
  });
}

async function authenticatePatient(
  server: Parameters<typeof request>[0],
  phone: string,
): Promise<string> {
  const challenge = await request(server)
    .post('/api/v1/auth/request-otp')
    .send({ phone })
    .expect(202);
  const verified = await request(server)
    .post('/api/v1/auth/verify-otp')
    .send({
      challengeId: challenge.body.challengeId,
      otp: challenge.body.developmentOtp,
      deviceId: 'doctor-domain-patient',
      platform: 'android',
    })
    .expect(200);
  return verified.body.accessToken as string;
}

async function authenticateReceptionist(
  server: Parameters<typeof request>[0],
  email: string,
  password: string,
): Promise<string> {
  const response = await request(server)
    .post('/api/v1/auth/login')
    .send({
      email,
      password,
      deviceId: 'doctor-domain-reception',
      platform: 'web',
    })
    .expect(200);
  return response.body.accessToken as string;
}

async function enableDoctorLogin(
  doctorId: string,
  tenant: Awaited<ReturnType<typeof createTenant>>,
) {
  const doctor = await prisma.doctor.findUniqueOrThrow({
    where: { id: doctorId },
    include: { staffAccount: true },
  });
  const email = `doctor-login-${suffix}@example.invalid`;
  const password = 'Fictional-Doctor-Password-2026!';
  await prisma.staffAccount.update({
    where: { id: doctor.staffAccountId },
    data: { email, passwordHash: await hashPassword(password) },
  });
  await prisma.identityRoleAssignment.create({
    data: {
      userId: doctor.staffAccount.userId,
      role: 'doctor',
      organizationId: tenant.organizationId,
      clinicId: tenant.clinicId,
    },
  });
  await prisma.clinicMembership.create({
    data: {
      userId: doctor.staffAccount.userId,
      role: 'doctor',
      organizationId: tenant.organizationId,
      clinicId: tenant.clinicId,
    },
  });
  return { email, password };
}

async function createStaffRole(
  tenant: Awaited<ReturnType<typeof createTenant>>,
  role: 'clinicManager',
) {
  const email = `${role.toLowerCase()}-${suffix}@example.invalid`;
  const password = 'Fictional-Manager-Password-2026!';
  await prisma.user.create({
    data: {
      staffAccount: {
        create: { email, passwordHash: await hashPassword(password) },
      },
      roles: {
        create: {
          role,
          organizationId: tenant.organizationId,
          clinicId: tenant.clinicId,
        },
      },
      memberships: {
        create: {
          role,
          organizationId: tenant.organizationId,
          clinicId: tenant.clinicId,
        },
      },
    },
  });
  return { email, password };
}

async function createPlatformAdministrator(
  tenant: Awaited<ReturnType<typeof createTenant>>,
) {
  const email = `platform-${suffix}@example.invalid`;
  const password = 'Fictional-Platform-Password-2026!';
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
