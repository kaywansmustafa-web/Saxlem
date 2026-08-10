/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import {
  apiPrisma,
  createApiTenant,
  createQueueApiApplication,
  createRolePrincipal,
} from './live-queue-api-fixture';

describe('patient directory API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createQueueApiApplication();
  });

  afterAll(async () => {
    await app.close();
    await apiPrisma.$disconnect();
  });

  it('enforces exact tenant and clinic scope, inactive exclusions, stable cursors, and audit scope', async () => {
    const tenant = await createApiTenant(`patient-directory-${Date.now()}`);
    const otherClinic = await apiPrisma.clinic.create({
      data: {
        organizationId: tenant.organizationId,
        name: 'Directory Other Clinic',
        code: `directory-other-${Date.now()}`,
        timezone: 'Asia/Baghdad',
      },
    });
    const foreignTenant = await createApiTenant(
      `patient-directory-foreign-${Date.now()}`,
    );
    const manager = await createRolePrincipal('clinicManager', tenant);
    const doctor = await createRolePrincipal('doctor', tenant);
    const otherClinicDoctor = await createRolePrincipal('doctor', {
      organizationId: tenant.organizationId,
      clinicId: otherClinic.id,
    });
    const foreignDoctor = await createRolePrincipal('doctor', foreignTenant);
    const alpha = await patientWithAppointment(
      tenant,
      doctor.doctorId!,
      'Alpha',
      'Ali',
      0,
    );
    const beta = await patientWithAppointment(
      tenant,
      doctor.doctorId!,
      'Beta',
      'Ali',
      1,
    );
    await patientWithAppointment(
      { organizationId: tenant.organizationId, clinicId: otherClinic.id },
      otherClinicDoctor.doctorId!,
      'CrossClinic',
      'Ali',
      2,
    );
    await patientWithAppointment(
      foreignTenant,
      foreignDoctor.doctorId!,
      'Foreign',
      'Ali',
      3,
    );
    const inactive = await patientWithAppointment(
      tenant,
      doctor.doctorId!,
      'Inactive',
      'Ali',
      4,
    );
    await apiPrisma.organizationPatientProfile.update({
      where: {
        organizationId_patientProfileId: {
          organizationId: tenant.organizationId,
          patientProfileId: inactive.profileId,
        },
      },
      data: { status: 'inactive' },
    });
    const inactiveUser = await patientWithAppointment(
      tenant,
      doctor.doctorId!,
      'InactiveUser',
      'Ali',
      5,
    );
    await apiPrisma.user.update({
      where: { id: inactiveUser.userId },
      data: { status: 'inactive' },
    });

    const first = await request(app.getHttpServer())
      .get('/api/v1/patients/directory')
      .query({ q: 'Ali', pageSize: 1 })
      .set('Authorization', `Bearer ${manager.token}`)
      .expect(200);
    expect(first.body.items).toHaveLength(1);
    expect(first.body.nextCursor).toEqual(expect.any(String));

    const second = await request(app.getHttpServer())
      .get('/api/v1/patients/directory')
      .query({ q: 'Ali', pageSize: 1, cursor: first.body.nextCursor })
      .set('Authorization', `Bearer ${manager.token}`)
      .expect(200);
    expect(second.body.items).toHaveLength(1);
    expect(
      new Set(
        [...first.body.items, ...second.body.items].map(
          (item) => item.patientProfileId,
        ),
      ),
    ).toEqual(new Set([alpha.profileId, beta.profileId]));
    expect(second.body.nextCursor).toBeNull();

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/patients/directory/${alpha.profileId}`)
      .set('Authorization', `Bearer ${manager.token}`)
      .expect(200);
    expect(Object.keys(detail.body).sort()).toEqual([
      'active',
      'appointments',
      'displayName',
      'patientProfileId',
    ]);
    expect(detail.body.appointments.upcoming).toHaveLength(1);

    await request(app.getHttpServer())
      .get('/api/v1/patients/directory')
      .query({ q: alpha.phone.slice(-6) })
      .set('Authorization', `Bearer ${manager.token}`)
      .expect(200)
      .expect((response) =>
        expect(
          response.body.items.map(
            (item: { patientProfileId: string }) => item.patientProfileId,
          ),
        ).toContain(alpha.profileId),
      );
    await request(app.getHttpServer())
      .get('/api/v1/patients/directory')
      .query({ q: alpha.profileId.slice(0, 8) })
      .set('Authorization', `Bearer ${manager.token}`)
      .expect(200)
      .expect((response) =>
        expect(
          response.body.items.map(
            (item: { patientProfileId: string }) => item.patientProfileId,
          ),
        ).toContain(alpha.profileId),
      );

    const audits = await apiPrisma.auditEvent.findMany({
      where: {
        actorUserId: manager.userId,
        action: { startsWith: 'patient.directory.' },
      },
    });
    expect(audits).toHaveLength(5);
    expect(
      audits.every((audit) => audit.organizationId === tenant.organizationId),
    ).toBe(true);
    expect(audits.every((audit) => audit.clinicId === tenant.clinicId)).toBe(
      true,
    );
    expect(JSON.stringify(audits)).not.toContain('Ali');
  });

  it('rejects unsupported roles, foreign clinic access, and cursor tampering', async () => {
    const tenant = await createApiTenant(
      `patient-directory-auth-${Date.now()}`,
    );
    const manager = await createRolePrincipal('clinicManager', tenant);
    const doctor = await createRolePrincipal('doctor', tenant);
    const patient = await createRolePrincipal('patient', tenant);
    const platform = await createRolePrincipal('platformAdministrator', tenant);
    const seeded = await patientWithAppointment(
      tenant,
      doctor.doctorId!,
      'Cursor',
      'Patient',
      0,
    );
    await patientWithAppointment(
      tenant,
      doctor.doctorId!,
      'CursorTwo',
      'Patient',
      1,
    );

    for (const principal of [doctor, patient, platform]) {
      await request(app.getHttpServer())
        .get('/api/v1/patients/directory')
        .query({ q: 'Patient' })
        .set('Authorization', `Bearer ${principal.token}`)
        .expect(403);
    }

    const page = await request(app.getHttpServer())
      .get('/api/v1/patients/directory')
      .query({ q: 'Patient', pageSize: 1 })
      .set('Authorization', `Bearer ${manager.token}`)
      .expect(200);
    expect(page.body.nextCursor).toEqual(expect.any(String));
    const [payload, signature] = String(page.body.nextCursor).split('.');
    expect(payload).toBeDefined();
    expect(signature).toBeDefined();
    const decoded = JSON.parse(
      Buffer.from(payload!, 'base64url').toString('utf8'),
    );
    const tampered = Buffer.from(
      JSON.stringify({ ...decoded, clinicId: seeded.profileId }),
    ).toString('base64url');
    await request(app.getHttpServer())
      .get('/api/v1/patients/directory')
      .query({ q: 'Patient', pageSize: 1, cursor: `${tampered}.${signature!}` })
      .set('Authorization', `Bearer ${manager.token}`)
      .expect(400);
  });
});

async function patientWithAppointment(
  tenant: { organizationId: string; clinicId: string },
  doctorId: string,
  firstName: string,
  lastName: string,
  minute: number,
) {
  const patient = await createRolePrincipal('patient', tenant);
  const account = await apiPrisma.patientAccount.findUniqueOrThrow({
    where: { userId: patient.userId },
  });
  const profile = await apiPrisma.patientProfile.create({
    data: {
      patientAccountId: account.id,
      firstName,
      lastName,
      dateOfBirth: new Date('1990-01-01T00:00:00.000Z'),
    },
  });
  await apiPrisma.organizationPatientProfile.create({
    data: {
      organizationId: tenant.organizationId,
      patientProfileId: profile.id,
    },
  });
  await apiPrisma.appointment.create({
    data: {
      organizationId: tenant.organizationId,
      clinicId: tenant.clinicId,
      doctorId,
      patientProfileId: profile.id,
      origin: 'patientBooked',
      startsAt: new Date(Date.now() + (60 + minute * 30) * 60_000),
      durationMinutes: 20,
      feeIqd: 25000,
      status: 'confirmed',
    },
  });
  return {
    profileId: profile.id,
    userId: patient.userId,
    phone: account.normalizedPhoneNumber,
  };
}
