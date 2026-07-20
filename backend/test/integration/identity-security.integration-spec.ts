/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { createApplication } from '../../src/main';
import { loadConfiguration } from '../../src/config/environment';
import {
  hashOpaqueToken,
  hashPassword,
} from '../../src/modules/identity/domain/security';

const url = process.env.TEST_DATABASE_URL!;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});
const configuration = loadConfiguration({
  SAXLEM_BACKEND_ENV: 'development',
  DATABASE_URL: url,
  ACCESS_TOKEN_SECRET: 'identity-access-secret-at-least-32-characters',
  REFRESH_TOKEN_SECRET: 'identity-refresh-secret-at-least-32-characters',
  OTP_SECRET: 'identity-otp-secret-at-least-32-characters',
  AUDIT_HASH_SECRET: 'identity-audit-secret-at-least-32-characters',
  OPENAPI_ENABLED: 'false',
});
const device = { deviceId: 'fictional-device', platform: 'android' };

describe('identity and session persistence', () => {
  beforeAll(() =>
    prisma.otpChallenge.deleteMany({
      where: { normalizedPhoneNumber: { startsWith: '+964750000000' } },
    }),
  );
  afterAll(() => prisma.$disconnect());

  it('stores only an OTP hash, verifies, rotates, detects reuse, and logs out all', async () => {
    const app = await createApplication(configuration);
    await app.init();
    const requested = await request(app.getHttpServer())
      .post('/api/v1/auth/request-otp')
      .send({ phone: '+9647500000000' })
      .expect(202);
    const otp = requested.body.developmentOtp as string;
    const challenge = await prisma.otpChallenge.findUniqueOrThrow({
      where: { id: requested.body.challengeId as string },
    });
    expect(challenge.otpHash).not.toContain(otp);
    const verified = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .send({ challengeId: challenge.id, otp, ...device })
      .expect(200);
    const claims = await new JwtService().verifyAsync(
      verified.body.accessToken as string,
      {
        secret: configuration.accessTokenSecret,
        issuer: 'saxlem',
        audience: 'saxlem-clients',
      },
    );
    expect(claims).toMatchObject({
      sub: expect.any(String),
      sid: expect.any(String),
      jti: expect.any(String),
      typ: 'access',
      auth_time: expect.any(Number),
      av: 1,
      rv: 1,
      role: 'patient',
    });
    const first = verified.body.refreshToken as string;
    const rotated = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: first, ...device })
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: first, ...device })
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/v1/auth/logout-all')
      .send({ refreshToken: rotated.body.refreshToken })
      .expect(204);
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: rotated.body.refreshToken, ...device })
      .expect(401);
    await app.close();
  });

  it('enforces resend limits and keeps exactly one active challenge', async () => {
    const app = await createApplication(configuration);
    await app.init();
    const phone = '+9647500000003';
    for (let requestNumber = 0; requestNumber < 3; requestNumber++)
      await request(app.getHttpServer())
        .post('/api/v1/auth/request-otp')
        .send({ phone })
        .expect(202);
    await request(app.getHttpServer())
      .post('/api/v1/auth/request-otp')
      .send({ phone })
      .expect(429);
    expect(
      await prisma.otpChallenge.count({
        where: { normalizedPhoneNumber: phone, consumedAt: null },
      }),
    ).toBe(1);
    await app.close();
  });

  it('revokes only the supplied session on logout and records audit events', async () => {
    const app = await createApplication(configuration);
    await app.init();
    const requested = await request(app.getHttpServer())
      .post('/api/v1/auth/request-otp')
      .send({ phone: '+9647500000004' })
      .expect(202);
    const verified = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .send({
        challengeId: requested.body.challengeId,
        otp: requested.body.developmentOtp,
        ...device,
      })
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .send({ refreshToken: verified.body.refreshToken })
      .expect(204);
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: verified.body.refreshToken, ...device })
      .expect(401);
    expect(await prisma.authenticationEvent.count()).toBeGreaterThan(0);
    await app.close();
  });

  it('expires and locks OTP challenges after repeated failures', async () => {
    const app = await createApplication(configuration);
    await app.init();
    const expired = await request(app.getHttpServer())
      .post('/api/v1/auth/request-otp')
      .send({ phone: '+9647500000001' })
      .expect(202);
    await prisma.otpChallenge.update({
      where: { id: expired.body.challengeId as string },
      data: { expiresAt: new Date(0) },
    });
    await request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .send({
        challengeId: expired.body.challengeId,
        otp: expired.body.developmentOtp,
        ...device,
      })
      .expect(401);
    const locked = await request(app.getHttpServer())
      .post('/api/v1/auth/request-otp')
      .send({ phone: '+9647500000002' })
      .expect(202);
    for (let attempt = 0; attempt < 5; attempt++)
      await request(app.getHttpServer())
        .post('/api/v1/auth/verify-otp')
        .send({
          challengeId: locked.body.challengeId,
          otp: '000000',
          ...device,
        })
        .expect(401);
    expect(
      (
        await prisma.otpChallenge.findUniqueOrThrow({
          where: { id: locked.body.challengeId as string },
        })
      ).lockedAt,
    ).not.toBeNull();
    await app.close();
  });

  it('authenticates a fictional staff identity with Argon2id', async () => {
    const email = `security-foundation-${Date.now()}@example.invalid`;
    const password = 'Fictional-Staff-Password-2026!';
    const organization = await prisma.organization.create({
      data: { name: 'Identity Security Clinic Group' },
    });
    const clinic = await prisma.clinic.create({
      data: {
        organizationId: organization.id,
        name: 'Identity Security Clinic',
        code: `security-${Date.now()}`,
        timezone: 'Asia/Baghdad',
      },
    });
    await prisma.user.create({
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
    const app = await createApplication(configuration);
    await app.init();
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: email.toUpperCase(), password, ...device })
      .expect(200);
    expect(response.body.accessToken).toEqual(expect.any(String));
    const staff = await prisma.staffAccount.findUniqueOrThrow({
      where: { email },
    });
    await prisma.clinicMembership.updateMany({
      where: { userId: staff.userId },
      data: { status: 'inactive' },
    });
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password, ...device })
      .expect(403);
    await app.close();
  });

  it('allows only one concurrent OTP verification', async () => {
    const app = await createApplication(configuration);
    await app.init();
    const requested = await request(app.getHttpServer())
      .post('/api/v1/auth/request-otp')
      .send({ phone: '+9647500000005' })
      .expect(202);
    const payload = {
      challengeId: requested.body.challengeId,
      otp: requested.body.developmentOtp,
      ...device,
    };
    const responses = await Promise.all([
      request(app.getHttpServer())
        .post('/api/v1/auth/verify-otp')
        .send(payload),
      request(app.getHttpServer())
        .post('/api/v1/auth/verify-otp')
        .send(payload),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([
      200, 401,
    ]);
    await app.close();
  });

  it('serializes concurrent OTP replacement and failed attempts', async () => {
    const app = await createApplication(configuration);
    await app.init();
    const phone = '+9647500000006';
    const requests = await Promise.all([
      request(app.getHttpServer())
        .post('/api/v1/auth/request-otp')
        .send({ phone }),
      request(app.getHttpServer())
        .post('/api/v1/auth/request-otp')
        .send({ phone }),
      request(app.getHttpServer())
        .post('/api/v1/auth/request-otp')
        .send({ phone }),
    ]);
    expect(requests.every((response) => response.status === 202)).toBe(true);
    expect(
      await prisma.otpChallenge.count({
        where: { normalizedPhoneNumber: phone, consumedAt: null },
      }),
    ).toBe(1);
    const active = await prisma.otpChallenge.findFirstOrThrow({
      where: { normalizedPhoneNumber: phone, consumedAt: null },
    });
    const attempts = await Promise.all(
      Array.from({ length: 5 }, () =>
        request(app.getHttpServer())
          .post('/api/v1/auth/verify-otp')
          .send({
            challengeId: active.id,
            otp: '999999',
            ...device,
          }),
      ),
    );
    expect(attempts.every((response) => response.status === 401)).toBe(true);
    expect(
      (
        await prisma.otpChallenge.findUniqueOrThrow({
          where: { id: active.id },
        })
      ).attemptCount,
    ).toBe(5);
    await app.close();
  });

  it('rejects disabled patients, device mismatch, and absolute expiry', async () => {
    const app = await createApplication(configuration);
    await app.init();
    const requested = await request(app.getHttpServer())
      .post('/api/v1/auth/request-otp')
      .send({ phone: '+9647500000007' })
      .expect(202);
    const verified = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .send({
        challengeId: requested.body.challengeId,
        otp: requested.body.developmentOtp,
        ...device,
      })
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({
        refreshToken: verified.body.refreshToken,
        deviceId: 'different-device',
        platform: 'android',
      })
      .expect(401);
    const session = await prisma.refreshSession.findUniqueOrThrow({
      where: {
        tokenHash: hashOpaqueToken(verified.body.refreshToken as string),
      },
    });
    await prisma.sessionFamily.update({
      where: { id: session.familyId },
      data: { expiresAt: new Date(0) },
    });
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: verified.body.refreshToken, ...device })
      .expect(401);
    const account = await prisma.patientAccount.findUniqueOrThrow({
      where: { normalizedPhoneNumber: '+9647500000007' },
    });
    await prisma.user.update({
      where: { id: account.userId },
      data: { status: 'inactive' },
    });
    const next = await request(app.getHttpServer())
      .post('/api/v1/auth/request-otp')
      .send({ phone: '+9647500000007' })
      .expect(202);
    await request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .send({
        challengeId: next.body.challengeId,
        otp: next.body.developmentOtp,
        ...device,
      })
      .expect(403);
    await app.close();
  });

  it('enforces tenant scope integrity for role assignments', async () => {
    const user = await prisma.user.create({ data: {} });
    await expect(
      prisma.identityRoleAssignment.create({
        data: { userId: user.id, role: 'receptionist' },
      }),
    ).rejects.toThrow();
    const first = await prisma.organization.create({
      data: { name: `First tenant ${Date.now()}` },
    });
    const second = await prisma.organization.create({
      data: { name: `Second tenant ${Date.now()}` },
    });
    const clinic = await prisma.clinic.create({
      data: {
        organizationId: first.id,
        name: 'Tenant integrity clinic',
        code: `tenant-integrity-${Date.now()}`,
        timezone: 'Asia/Baghdad',
      },
    });
    await expect(
      prisma.identityRoleAssignment.create({
        data: {
          userId: user.id,
          role: 'receptionist',
          organizationId: second.id,
          clinicId: clinic.id,
        },
      }),
    ).rejects.toThrow();
  });
});
