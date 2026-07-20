import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { loadConfiguration } from '../../../config/environment';
import type { PrismaService } from '../../../infrastructure/database/prisma.service';
import { JwtAuthGuard, type AuthenticatedRequest } from './jwt-auth.guard';

const configuration = loadConfiguration({
  SAXLEM_BACKEND_ENV: 'test',
  DATABASE_URL: 'postgresql://security.invalid/saxlem',
  ACCESS_TOKEN_SECRET: 'guard-access-secret-at-least-32-characters',
  REFRESH_TOKEN_SECRET: 'guard-refresh-secret-at-least-32-characters',
  OTP_SECRET: 'guard-otp-secret-at-least-32-characters',
  AUDIT_HASH_SECRET: 'guard-audit-secret-at-least-32-characters',
});

function contextFor(request: AuthenticatedRequest): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => function protectedHandler() {},
    getClass: () => class ProtectedController {},
  } as unknown as ExecutionContext;
}

function requestFor(token: string, tenant?: string): AuthenticatedRequest {
  const headers: Record<string, string> = { authorization: `Bearer ${token}` };
  if (tenant) headers['x-organization-id'] = tenant;
  return {
    headers,
    get: (name: string) => headers[name.toLowerCase()],
  } as unknown as Request;
}

describe('JwtAuthGuard security enforcement', () => {
  const jwt = new JwtService();
  const now = new Date();
  const session = {
    id: 'session-id',
    userId: 'user-id',
    revokedAt: null,
    expiresAt: new Date(now.getTime() + 60_000),
    family: {
      role: 'receptionist',
      organizationId: 'organization-id',
      clinicId: 'clinic-id',
      revokedAt: null,
      expiresAt: new Date(now.getTime() + 60_000),
    },
    user: {
      id: 'user-id',
      status: 'active',
      authorizationVersion: 1,
      roleVersion: 1,
      roles: [
        {
          role: 'receptionist',
          organizationId: 'organization-id',
          clinicId: 'clinic-id',
        },
      ],
      memberships: [],
    },
  };
  const prisma = {
    db: {
      refreshSession: { findUnique: jest.fn().mockResolvedValue(session) },
      clinicMembership: {
        findFirst: jest.fn().mockResolvedValue({ id: 'membership-id' }),
      },
    },
  } as unknown as PrismaService;

  function claims() {
    return {
      sub: 'user-id',
      sid: 'session-id',
      jti: 'token-id',
      typ: 'access',
      auth_time: Math.floor(Date.now() / 1000),
      av: 1,
      rv: 1,
      role: 'receptionist',
      org: 'organization-id',
      clinic: 'clinic-id',
    };
  }

  it('rejects a token signed with an unaccepted algorithm', async () => {
    const token = await jwt.signAsync(claims(), {
      secret: configuration.accessTokenSecret,
      algorithm: 'HS384',
      issuer: 'saxlem',
      audience: 'saxlem-clients',
      expiresIn: '10m',
    });
    const guard = new JwtAuthGuard(jwt, prisma, new Reflector(), configuration);
    await expect(
      guard.canActivate(contextFor(requestFor(token))),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('resolves the principal and capabilities for an active tenant', async () => {
    const token = await jwt.signAsync(claims(), {
      secret: configuration.accessTokenSecret,
      algorithm: 'HS256',
      issuer: 'saxlem',
      audience: 'saxlem-clients',
      expiresIn: '10m',
    });
    const request = requestFor(token, 'organization-id');
    const guard = new JwtAuthGuard(jwt, prisma, new Reflector(), configuration);
    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(request.principal).toMatchObject({
      id: 'user-id',
      kind: 'staff',
      sessionId: 'session-id',
    });
    expect(request.principal?.capabilities.has('clinic:operations:read')).toBe(
      true,
    );
  });

  it('rejects tenant mismatch and unavailable capabilities', async () => {
    const token = await jwt.signAsync(claims(), {
      secret: configuration.accessTokenSecret,
      algorithm: 'HS256',
      issuer: 'saxlem',
      audience: 'saxlem-clients',
      expiresIn: '10m',
    });
    const guard = new JwtAuthGuard(jwt, prisma, new Reflector(), configuration);
    await expect(
      guard.canActivate(
        contextFor(requestFor(token, 'different-organization')),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    const reflector = {
      getAllAndOverride: () => ['clinic:operations:write'],
    } as unknown as Reflector;
    const capabilityGuard = new JwtAuthGuard(
      jwt,
      prisma,
      reflector,
      configuration,
    );
    await expect(
      capabilityGuard.canActivate(contextFor(requestFor(token))),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
