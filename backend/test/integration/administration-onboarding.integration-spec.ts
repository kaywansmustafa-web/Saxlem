/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { loadConfiguration } from '../../src/config/environment';
import { createApplication } from '../../src/main';
import { hashPassword } from '../../src/modules/identity/domain/security';

const url = process.env.TEST_DATABASE_URL!;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});
const configuration = loadConfiguration({
  SAXLEM_BACKEND_ENV: 'test',
  DATABASE_URL: url,
  ACCESS_TOKEN_SECRET: 'administration-access-secret-at-least-32-characters',
  REFRESH_TOKEN_SECRET: 'administration-refresh-secret-at-least-32-characters',
  OTP_SECRET: 'administration-otp-secret-at-least-32-characters',
  AUDIT_HASH_SECRET: 'administration-audit-secret-at-least-32-characters',
  OPENAPI_ENABLED: 'false',
});

describe('platform administration onboarding API', () => {
  afterAll(() => prisma.$disconnect());

  it('authenticates a global administrator and atomically creates, audits, replays, lists and reads organizations and clinics', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const email = `admin-${suffix}@example.invalid`;
    const password = 'Fictional-Administration-Password-2026!';
    const administrator = await prisma.user.create({
      data: {
        staffAccount: {
          create: { email, passwordHash: await hashPassword(password) },
        },
        roles: { create: { role: 'platformAdministrator' } },
      },
    });
    const app = await createApplication(configuration);
    await app.init();
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password, deviceId: `admin-${suffix}`, platform: 'web' })
      .expect(200);
    const authorization = `Bearer ${String(login.body.accessToken)}`;

    const organizationKey = `organization-${suffix}`;
    const organization = await request(app.getHttpServer())
      .post('/api/v1/administration/organizations')
      .set('Authorization', authorization)
      .set('Idempotency-Key', organizationKey)
      .send({ name: `Saxlem ${suffix}` })
      .expect(201);
    expect(organization.body).toMatchObject({
      name: `Saxlem ${suffix}`,
      status: 'active',
    });
    expect(Object.keys(organization.body).sort()).toEqual([
      'createdAt',
      'id',
      'name',
      'status',
      'updatedAt',
    ]);
    const replay = await request(app.getHttpServer())
      .post('/api/v1/administration/organizations')
      .set('Authorization', authorization)
      .set('Idempotency-Key', organizationKey)
      .send({ name: `Saxlem ${suffix}` })
      .expect(201);
    expect(replay.body.id).toBe(organization.body.id);
    await request(app.getHttpServer())
      .post('/api/v1/administration/organizations')
      .set('Authorization', authorization)
      .set('Idempotency-Key', organizationKey)
      .send({ name: `Different ${suffix}` })
      .expect(409);

    const clinicKey = `clinic-${suffix}`;
    const clinic = await request(app.getHttpServer())
      .post('/api/v1/administration/clinics')
      .set('Authorization', authorization)
      .set('Idempotency-Key', clinicKey)
      .send({
        organizationId: organization.body.id,
        name: 'Duhok Main',
        code: `dhk_${suffix.replace(/-/g, '').slice(-12)}`,
        timezone: 'Asia/Baghdad',
      })
      .expect(201);
    expect(clinic.body).toMatchObject({
      organizationId: organization.body.id,
      code: expect.stringMatching(/^DHK_/u),
      timezone: 'Asia/Baghdad',
      status: 'active',
    });
    await request(app.getHttpServer())
      .get(`/api/v1/administration/organizations/${organization.body.id}`)
      .set('Authorization', authorization)
      .expect(200);
    await request(app.getHttpServer())
      .get(`/api/v1/administration/clinics/${clinic.body.id}`)
      .set('Authorization', authorization)
      .expect(200);
    const page = await request(app.getHttpServer())
      .get(
        `/api/v1/administration/clinics?organizationId=${organization.body.id}&pageSize=1`,
      )
      .set('Authorization', authorization)
      .expect(200);
    expect(page.body.items).toHaveLength(1);
    expect(page.body.items[0].id).toBe(clinic.body.id);

    const concurrentBody = {
      organizationId: organization.body.id,
      name: 'Concurrent Clinic',
      code: `CC_${suffix.replace(/-/g, '').slice(-12)}`,
      timezone: 'Asia/Baghdad',
    };
    const sameKey = `concurrent-same-${suffix}`;
    const sameCommand = await Promise.all([
      request(app.getHttpServer())
        .post('/api/v1/administration/clinics')
        .set('Authorization', authorization)
        .set('Idempotency-Key', sameKey)
        .send(concurrentBody),
      request(app.getHttpServer())
        .post('/api/v1/administration/clinics')
        .set('Authorization', authorization)
        .set('Idempotency-Key', sameKey)
        .send(concurrentBody),
    ]);
    expect(sameCommand.map((response) => response.status)).toEqual([201, 201]);
    expect(sameCommand[0].body.id).toBe(sameCommand[1].body.id);

    const duplicateCode = await Promise.all([
      request(app.getHttpServer())
        .post('/api/v1/administration/clinics')
        .set('Authorization', authorization)
        .set('Idempotency-Key', `code-a-${suffix}`)
        .send({
          ...concurrentBody,
          name: 'Code A',
          code: `DUP_${suffix.replace(/-/g, '').slice(-12)}`,
        }),
      request(app.getHttpServer())
        .post('/api/v1/administration/clinics')
        .set('Authorization', authorization)
        .set('Idempotency-Key', `code-b-${suffix}`)
        .send({
          ...concurrentBody,
          name: 'Code B',
          code: `DUP_${suffix.replace(/-/g, '').slice(-12)}`,
        }),
    ]);
    expect(duplicateCode.map((response) => response.status).sort()).toEqual([
      201, 409,
    ]);

    const secondOrganization = await request(app.getHttpServer())
      .post('/api/v1/administration/organizations')
      .set('Authorization', authorization)
      .set('Idempotency-Key', `organization-second-${suffix}`)
      .send({ name: `Second ${suffix}` })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/administration/clinics')
      .set('Authorization', authorization)
      .set('Idempotency-Key', `code-other-organization-${suffix}`)
      .send({
        ...concurrentBody,
        organizationId: secondOrganization.body.id,
        name: 'Same Code, Other Organization',
        code: `DUP_${suffix.replace(/-/g, '').slice(-12)}`,
      })
      .expect(201);

    const firstClinicPage = await request(app.getHttpServer())
      .get(
        `/api/v1/administration/clinics?organizationId=${organization.body.id}&pageSize=1`,
      )
      .set('Authorization', authorization)
      .expect(200);
    expect(firstClinicPage.body.nextCursor).toEqual(expect.any(String));
    await request(app.getHttpServer())
      .get(
        `/api/v1/administration/clinics?organizationId=${organization.body.id}&pageSize=1&cursor=${encodeURIComponent(String(firstClinicPage.body.nextCursor))}`,
      )
      .set('Authorization', authorization)
      .expect(200);
    await request(app.getHttpServer())
      .get(
        `/api/v1/administration/clinics?organizationId=${secondOrganization.body.id}&pageSize=1&cursor=${encodeURIComponent(String(firstClinicPage.body.nextCursor))}`,
      )
      .set('Authorization', authorization)
      .expect(400);

    expect(
      await prisma.auditEvent.count({
        where: {
          actorUserId: administrator.id,
          targetId: { in: [organization.body.id, clinic.body.id] },
        },
      }),
    ).toBeGreaterThanOrEqual(2);
    expect(
      await prisma.outboxEvent.count({
        where: { aggregateId: { in: [organization.body.id, clinic.body.id] } },
      }),
    ).toBe(2);
    await app.close();
  });
});
