/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { createApplication } from '../../src/main';
import { loadConfiguration } from '../../src/config/environment';

const url = process.env.TEST_DATABASE_URL!;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});
const configuration = loadConfiguration({
  SAXLEM_BACKEND_ENV: 'development',
  DATABASE_URL: url,
  ACCESS_TOKEN_SECRET: 'patient-access-secret-at-least-32-characters',
  REFRESH_TOKEN_SECRET: 'patient-refresh-secret-at-least-32-characters',
  OTP_SECRET: 'patient-otp-secret-at-least-32-characters',
  AUDIT_HASH_SECRET: 'patient-audit-secret-at-least-32-characters',
  OPENAPI_ENABLED: 'false',
});

describe('patient domain API', () => {
  afterAll(() => prisma.$disconnect());

  it('enforces ownership, Self, archive, active-profile, concurrency, and audit rules', async () => {
    const app = await createApplication(configuration);
    await app.init();
    const token = await authenticate(app.getHttpServer(), '+9647500000005');
    const otherToken = await authenticate(
      app.getHttpServer(),
      '+9647500000006',
    );
    const api = () => request(app.getHttpServer());
    const self = await api()
      .post('/api/v1/patients/profiles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'ژیان',
        lastName: 'Ahmed',
        dateOfBirth: '1992-05-10',
        gender: 'unspecified',
        relationship: 'me',
      })
      .expect(201);
    expect(self.body).toMatchObject({
      relationship: 'me',
      active: true,
      version: 1,
    });
    await api()
      .post('/api/v1/patients/profiles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Duplicate',
        lastName: 'Self',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        relationship: 'me',
      })
      .expect(409);
    const family = await api()
      .post('/api/v1/patients/profiles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Sara',
        lastName: 'Ahmed',
        dateOfBirth: '2010-02-03',
        gender: 'female',
        relationship: 'daughter',
      })
      .expect(201);
    await api()
      .get(`/api/v1/patients/profiles/${family.body.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(404);
    await api()
      .post('/api/v1/patients/active')
      .set('Authorization', `Bearer ${token}`)
      .send({ profileId: family.body.id })
      .expect(200)
      .expect((response) =>
        expect(response.body.activeProfileId).toBe(family.body.id),
      );
    await api()
      .delete(`/api/v1/patients/profiles/${family.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ version: 1 })
      .expect(409);
    await api()
      .post('/api/v1/patients/active')
      .set('Authorization', `Bearer ${token}`)
      .send({ profileId: self.body.id })
      .expect(200);
    await api()
      .patch(`/api/v1/patients/profiles/${family.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Sara',
        lastName: 'Ahmed',
        dateOfBirth: '2010-02-03',
        gender: 'female',
        version: 1,
      })
      .expect(200);
    await api()
      .patch(`/api/v1/patients/profiles/${family.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Stale',
        lastName: 'Update',
        dateOfBirth: '2010-02-03',
        gender: 'female',
        version: 1,
      })
      .expect(409);
    await api()
      .delete(`/api/v1/patients/profiles/${family.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ version: 2 })
      .expect(204);
    await api()
      .post('/api/v1/patients/active')
      .set('Authorization', `Bearer ${token}`)
      .send({ profileId: family.body.id })
      .expect(409);
    await api()
      .delete(`/api/v1/patients/profiles/${self.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ version: 1 })
      .expect(403);
    expect(
      await prisma.auditEvent.count({
        where: {
          actorUserId: (
            await prisma.patientAccount.findUniqueOrThrow({
              where: { normalizedPhoneNumber: '+9647500000005' },
            })
          ).userId,
          action: { startsWith: 'patient.' },
        },
      }),
    ).toBeGreaterThanOrEqual(5);
    await app.close();
  });

  it('requires authentication and rejects tenant headers that cannot grant ownership', async () => {
    const app = await createApplication(configuration);
    await app.init();
    await request(app.getHttpServer())
      .get('/api/v1/patients/profiles')
      .expect(401);
    const token = await authenticate(app.getHttpServer(), '+9647500000007');
    await request(app.getHttpServer())
      .get('/api/v1/patients/profiles')
      .set('Authorization', `Bearer ${token}`)
      .set('x-organization-id', '00000000-0000-0000-0000-000000000001')
      .expect(200);
    await app.close();
  });
});

async function authenticate(
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
      deviceId: `device-${phone.slice(-4)}`,
      platform: 'android',
    })
    .expect(200);
  return verified.body.accessToken as string;
}
