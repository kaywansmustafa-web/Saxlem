import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import type { IdentityRole, Prisma } from '@prisma/client';
import { BACKEND_CONFIGURATION } from '../../../config/configuration.module';
import type { BackendConfiguration } from '../../../config/environment';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { DevelopmentOtpProvider } from '../infrastructure/development-otp.provider';
import {
  hashOpaqueToken,
  hashOtp,
  randomOpaqueToken,
  randomOtp,
  safeEqualHex,
  verifyPassword,
  hashPassword,
  keyedHash,
  passwordNeedsRehash,
} from '../domain/security';
import {
  RATE_LIMIT_BOUNDARY,
  type RateLimitAction,
  type RateLimitBoundary,
} from '../domain/providers';

export interface DeviceInput {
  deviceId: string;
  platform: string;
  userAgent?: string;
  ipAddress?: string;
}

interface IdentityContext {
  role: IdentityRole;
  organizationId?: string;
  clinicId?: string;
}

const DUMMY_PASSWORD_HASH = hashPassword(
  'Saxlem-Dummy-Credential-Verification-Only-2026!',
);
type StaffAccess = Prisma.StaffAccountGetPayload<{
  include: {
    doctor: true;
    user: {
      include: {
        roles: true;
        memberships: { include: { organization: true; clinic: true } };
      };
    };
  };
}>;
type SessionAccess = Prisma.RefreshSessionGetPayload<{
  include: {
    family: true;
    user: {
      include: {
        roles: true;
        staffAccount: { include: { doctor: true } };
        memberships: { include: { organization: true; clinic: true } };
      };
    };
  };
}>;

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    @Inject(BACKEND_CONFIGURATION)
    private readonly config: BackendConfiguration,
    @Inject(RATE_LIMIT_BOUNDARY)
    private readonly rateLimiter: RateLimitBoundary,
  ) {}

  async requestOtp(
    phone: string,
    ipAddress = 'unknown',
  ): Promise<{
    challengeId: string;
    expiresAt: string;
    developmentOtp?: string;
  }> {
    if (!/^\+9647\d{9}$/.test(phone))
      throw new UnauthorizedException('Phone number is invalid.');
    await this.limit('otpRequest', phone, ipAddress);
    if (
      this.config.environment !== 'development' &&
      this.config.environment !== 'test'
    )
      throw new ServiceUnavailableException(
        'OTP delivery provider is unavailable.',
      );
    const provider = DevelopmentOtpProvider.create(this.config.environment);
    const otp = randomOtp(),
      now = new Date(),
      expiresAt = new Date(now.getTime() + 5 * 60_000);
    const challenge = await this.prisma.db.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${phone}, 0))`;
      const previous = await transaction.otpChallenge.findFirst({
        where: {
          normalizedPhoneNumber: phone,
          createdAt: { gte: new Date(now.getTime() - 15 * 60_000) },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (previous && previous.resendCount >= 2)
        throw new HttpException(
          'OTP resend limit reached. Try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      await transaction.otpChallenge.updateMany({
        where: { normalizedPhoneNumber: phone, consumedAt: null },
        data: { consumedAt: now },
      });
      return transaction.otpChallenge.create({
        data: {
          normalizedPhoneNumber: phone,
          otpHash: hashOtp(phone, otp, this.config.otpSecret),
          expiresAt,
          resendCount: previous ? previous.resendCount + 1 : 0,
          lastSentAt: now,
        },
      });
    });
    await provider.deliver(phone, otp);
    await this.event('otpRequested', undefined, phone);
    return {
      challengeId: challenge.id,
      expiresAt: expiresAt.toISOString(),
      ...(this.config.environment === 'development'
        ? { developmentOtp: otp }
        : {}),
    };
  }

  async verifyOtp(
    challengeId: string,
    otp: string,
    device: DeviceInput,
    ipAddress = 'unknown',
  ) {
    await this.limit('otpVerify', challengeId, ipAddress);
    const result = await this.prisma.db.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${challengeId}, 0))`;
      const challenge = await transaction.otpChallenge.findUnique({
        where: { id: challengeId },
      });
      const candidate = hashOtp(
        challenge?.normalizedPhoneNumber ?? 'unknown',
        otp,
        this.config.otpSecret,
      );
      const valid = safeEqualHex(
        challenge?.otpHash ??
          hashOtp('unknown', '000000', this.config.otpSecret),
        candidate,
      );
      const now = new Date();
      if (
        !challenge ||
        challenge.consumedAt ||
        challenge.lockedAt ||
        challenge.expiresAt <= now
      )
        throw new UnauthorizedException('OTP challenge is invalid or expired.');
      if (!valid) {
        await transaction.otpChallenge.updateMany({
          where: { id: challenge.id, attemptCount: { lt: 5 }, lockedAt: null },
          data: { attemptCount: { increment: 1 } },
        });
        const attempted = await transaction.otpChallenge.findUniqueOrThrow({
          where: { id: challenge.id },
        });
        const locked = attempted.attemptCount >= 5;
        if (locked)
          await transaction.otpChallenge.updateMany({
            where: { id: challenge.id, lockedAt: null },
            data: { lockedAt: now },
          });
        return {
          userId: null,
          phone: challenge.normalizedPhoneNumber,
          locked,
        };
      }
      const consumed = await transaction.otpChallenge.updateMany({
        where: {
          id: challenge.id,
          consumedAt: null,
          lockedAt: null,
          expiresAt: { gt: now },
          otpHash: candidate,
        },
        data: { consumedAt: now },
      });
      if (consumed.count !== 1)
        throw new UnauthorizedException('OTP challenge is invalid or expired.');
      const account = await transaction.patientAccount.findUnique({
        where: { normalizedPhoneNumber: challenge.normalizedPhoneNumber },
        include: { user: { include: { roles: true } } },
      });
      if (account && account.user.status !== 'active')
        throw new ForbiddenException('Identity is disabled.');
      if (
        account &&
        !account.user.roles.some((assignment) => assignment.role === 'patient')
      )
        throw new ForbiddenException(
          'Identity is not eligible for patient access.',
        );
      const user =
        account?.user ??
        (await transaction.user.create({
          data: {
            patientAccount: {
              create: {
                normalizedPhoneNumber: challenge.normalizedPhoneNumber,
              },
            },
            roles: { create: { role: 'patient' } },
          },
        }));
      return {
        userId: user.id,
        phone: challenge.normalizedPhoneNumber,
        locked: false,
      };
    });
    if (!result.userId) {
      if (result.locked) await this.event('lockout', undefined, result.phone);
      throw new UnauthorizedException('OTP challenge is invalid or expired.');
    }
    await this.event('otpVerified', result.userId, result.phone);
    return this.issue(result.userId, { role: 'patient' }, device);
  }

  async login(
    email: string,
    password: string,
    device: DeviceInput,
    ipAddress = 'unknown',
  ) {
    const normalizedEmail = email.trim().toLowerCase();
    await this.limit('login', normalizedEmail, ipAddress);
    const staff = await this.prisma.db.staffAccount.findUnique({
      where: { email: normalizedEmail },
      include: {
        doctor: true,
        user: {
          include: {
            roles: true,
            memberships: { include: { organization: true, clinic: true } },
          },
        },
      },
    });
    const passwordHash = staff?.passwordHash ?? (await DUMMY_PASSWORD_HASH);
    const valid = await verifyPassword(passwordHash, password);
    if (!staff || !valid) {
      await this.event('loginFailed', staff?.userId, normalizedEmail);
      throw new UnauthorizedException('Invalid credentials.');
    }
    if (staff.user.status !== 'active')
      throw new ForbiddenException('Identity is disabled.');
    const context = this.staffContext(staff);
    if (!context)
      throw new ForbiddenException('No active clinic access is available.');
    if (passwordNeedsRehash(passwordHash))
      await this.prisma.db.staffAccount.update({
        where: { id: staff.id },
        data: { passwordHash: await hashPassword(password) },
      });
    await this.event('loginSucceeded', staff.userId, normalizedEmail);
    return this.issue(staff.userId, context, device);
  }

  async refresh(token: string, device: DeviceInput, ipAddress = 'unknown') {
    await this.limit('refresh', hashOpaqueToken(token), ipAddress);
    const hash = hashOpaqueToken(token),
      session = await this.prisma.db.refreshSession.findUnique({
        where: { tokenHash: hash },
        include: {
          family: true,
          user: {
            include: {
              roles: true,
              staffAccount: { include: { doctor: true } },
              memberships: { include: { organization: true, clinic: true } },
            },
          },
        },
      });
    if (!session) throw new UnauthorizedException('Refresh token is invalid.');
    if (session.user.status !== 'active')
      throw new UnauthorizedException('Identity is unavailable.');
    if (!this.sessionContextIsActive(session))
      throw new UnauthorizedException('Session authorization is unavailable.');
    this.validateDevice(session, device);
    if (session.family.expiresAt <= new Date())
      throw new UnauthorizedException('Session lifetime expired.');
    if (session.revokedAt || session.replacedById || session.family.revokedAt) {
      await this.prisma.db.sessionFamily.update({
        where: { id: session.familyId },
        data: { revokedAt: new Date() },
      });
      await this.prisma.db.refreshSession.updateMany({
        where: { familyId: session.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await this.event(
        'refreshReuseDetected',
        session.userId,
        undefined,
        session.familyId,
      );
      throw new UnauthorizedException('Refresh token reuse detected.');
    }
    if (session.expiresAt <= new Date())
      throw new UnauthorizedException('Refresh token expired.');
    const nextToken = randomOpaqueToken();
    const usedAt = new Date();
    let nextSessionId = '';
    try {
      await this.prisma.db.$transaction(async (transaction) => {
        const claimed = await transaction.refreshSession.updateMany({
          where: {
            id: session.id,
            revokedAt: null,
            replacedById: null,
          },
          data: { revokedAt: usedAt, lastUsedAt: usedAt },
        });
        if (claimed.count !== 1)
          throw new UnauthorizedException('Refresh token reuse detected.');
        const next = await transaction.refreshSession.create({
          data: {
            userId: session.userId,
            familyId: session.familyId,
            deviceId: session.deviceId,
            platform: session.platform,
            userAgent: session.userAgent ?? null,
            ipHash: this.deviceHash('ip', device.ipAddress ?? ipAddress),
            tokenHash: hashOpaqueToken(nextToken),
            expiresAt: new Date(
              Math.min(
                Date.now() + 30 * 86400_000,
                session.family.expiresAt.getTime(),
              ),
            ),
          },
        });
        nextSessionId = next.id;
        await transaction.refreshSession.update({
          where: { id: session.id },
          data: { replacedById: next.id },
        });
      });
    } catch (error) {
      if (!(error instanceof UnauthorizedException)) throw error;
      await this.prisma.db.sessionFamily.update({
        where: { id: session.familyId },
        data: { revokedAt: new Date() },
      });
      await this.prisma.db.refreshSession.updateMany({
        where: { familyId: session.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await this.event(
        'refreshReuseDetected',
        session.userId,
        undefined,
        session.familyId,
      );
      throw error;
    }
    await this.event('refresh', session.userId, undefined, session.familyId);
    return {
      accessToken: await this.access(
        session.user,
        nextSessionId,
        session.family.createdAt,
        {
          role: session.family.role,
          ...(session.family.organizationId
            ? { organizationId: session.family.organizationId }
            : {}),
          ...(session.family.clinicId
            ? { clinicId: session.family.clinicId }
            : {}),
        },
      ),
      refreshToken: nextToken,
      expiresInSeconds: 600,
    };
  }

  async logout(token: string, ipAddress = 'unknown'): Promise<void> {
    await this.limit('logout', hashOpaqueToken(token), ipAddress);
    const session = await this.prisma.db.refreshSession.findUnique({
      where: { tokenHash: hashOpaqueToken(token) },
    });
    if (session) {
      await this.prisma.db.refreshSession.updateMany({
        where: { id: session.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await this.event('logout', session.userId);
    }
  }
  async logoutAll(token: string, ipAddress = 'unknown'): Promise<void> {
    await this.limit('logoutAll', hashOpaqueToken(token), ipAddress);
    const session = await this.prisma.db.refreshSession.findUnique({
      where: { tokenHash: hashOpaqueToken(token) },
    });
    if (!session) return;
    await this.prisma.db.sessionFamily.updateMany({
      where: { userId: session.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.prisma.db.refreshSession.updateMany({
      where: { userId: session.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.event('logoutAll', session.userId);
  }

  private async issue(
    userId: string,
    context: IdentityContext,
    device: DeviceInput,
  ) {
    const raw = randomOpaqueToken();
    const now = new Date();
    const result = await this.prisma.db.$transaction(async (transaction) => {
      const user = await transaction.user.findUniqueOrThrow({
        where: { id: userId },
      });
      const family = await transaction.sessionFamily.create({
        data: {
          userId,
          expiresAt: new Date(now.getTime() + 90 * 86400_000),
          role: context.role,
          organizationId: context.organizationId ?? null,
          clinicId: context.clinicId ?? null,
        },
      });
      const session = await transaction.refreshSession.create({
        data: {
          userId,
          familyId: family.id,
          deviceId: device.deviceId,
          platform: device.platform,
          userAgent: this.deviceHash(
            'user-agent',
            device.userAgent ?? 'unknown',
          ),
          ipHash: this.deviceHash('ip', device.ipAddress ?? 'unknown'),
          tokenHash: hashOpaqueToken(raw),
          expiresAt: new Date(now.getTime() + 30 * 86400_000),
        },
      });
      return { user, session };
    });
    return {
      accessToken: await this.access(
        result.user,
        result.session.id,
        now,
        context,
      ),
      refreshToken: raw,
      expiresInSeconds: 600,
    };
  }
  private access(
    user: { id: string; authorizationVersion: number; roleVersion: number },
    sessionId: string,
    authenticatedAt: Date,
    context: IdentityContext,
  ): Promise<string> {
    return this.jwt.signAsync(
      {
        sub: user.id,
        sid: sessionId,
        jti: randomUUID(),
        typ: 'access',
        auth_time: Math.floor(authenticatedAt.getTime() / 1000),
        av: user.authorizationVersion,
        rv: user.roleVersion,
        role: context.role,
        ...(context.organizationId ? { org: context.organizationId } : {}),
        ...(context.clinicId ? { clinic: context.clinicId } : {}),
      },
      {
        secret: this.config.accessTokenSecret,
        algorithm: 'HS256',
        expiresIn: '10m',
        issuer: 'saxlem',
        audience: 'saxlem-clients',
      },
    );
  }

  private staffContext(staff: StaffAccess): IdentityContext | null {
    const administrator = staff.user.roles.find(
      (assignment) => assignment.role === 'platformAdministrator',
    );
    const activeMembership = staff.user.memberships.some(
      (membership) =>
        membership.status === 'active' &&
        membership.organization.status === 'active' &&
        membership.clinic.status === 'active',
    );
    if (administrator && activeMembership)
      return { role: 'platformAdministrator' };
    for (const assignment of staff.user.roles) {
      if (
        assignment.role === 'patient' ||
        !assignment.organizationId ||
        !assignment.clinicId
      )
        continue;
      const membership = staff.user.memberships.find(
        (candidate) =>
          candidate.status === 'active' &&
          candidate.organization.status === 'active' &&
          candidate.clinic.status === 'active' &&
          candidate.organizationId === assignment.organizationId &&
          candidate.clinicId === assignment.clinicId &&
          candidate.role === assignment.role,
      );
      if (membership && (assignment.role !== 'doctor' || staff.doctor))
        return {
          role: assignment.role,
          organizationId: assignment.organizationId,
          clinicId: assignment.clinicId,
        };
    }
    return null;
  }

  private sessionContextIsActive(session: SessionAccess): boolean {
    const hasRole = session.user.roles.some(
      (assignment) =>
        assignment.role === session.family.role &&
        assignment.organizationId === session.family.organizationId &&
        assignment.clinicId === session.family.clinicId,
    );
    if (!hasRole) return false;
    if (session.family.role === 'patient') return true;
    if (session.family.role === 'doctor' && !session.user.staffAccount?.doctor)
      return false;
    if (session.family.role === 'platformAdministrator')
      return session.user.memberships.some(
        (membership) =>
          membership.status === 'active' &&
          membership.organization.status === 'active' &&
          membership.clinic.status === 'active',
      );
    return session.user.memberships.some(
      (membership) =>
        membership.status === 'active' &&
        membership.organization.status === 'active' &&
        membership.clinic.status === 'active' &&
        membership.organizationId === session.family.organizationId &&
        membership.clinicId === session.family.clinicId &&
        membership.role === session.family.role,
    );
  }

  private validateDevice(
    session: { deviceId: string; platform: string; userAgent: string | null },
    device: DeviceInput,
  ): void {
    if (
      session.deviceId !== device.deviceId ||
      session.platform !== device.platform ||
      session.userAgent !==
        this.deviceHash('user-agent', device.userAgent ?? 'unknown')
    )
      throw new UnauthorizedException('Refresh device context does not match.');
  }

  private deviceHash(purpose: string, value: string): string {
    return keyedHash(purpose, value, this.config.auditHashSecret);
  }

  private async limit(
    action: RateLimitAction,
    subject: string,
    network: string,
  ): Promise<void> {
    const subjectAllowed = await this.rateLimiter.consume(
      keyedHash('rate-limit-subject', subject, this.config.auditHashSecret),
      action,
      'subject',
    );
    const networkAllowed = await this.rateLimiter.consume(
      keyedHash('rate-limit-network', network, this.config.auditHashSecret),
      action,
      'network',
    );
    if (!subjectAllowed || !networkAllowed)
      throw new HttpException(
        'Too many authentication attempts. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
  }
  private async event(
    type:
      | 'otpRequested'
      | 'otpVerified'
      | 'loginSucceeded'
      | 'loginFailed'
      | 'logout'
      | 'logoutAll'
      | 'refresh'
      | 'refreshReuseDetected'
      | 'lockout',
    userId?: string,
    subject?: string,
    family?: string,
  ) {
    await this.prisma.db.authenticationEvent.create({
      data: {
        type,
        ...(userId ? { userId } : {}),
        ...(subject
          ? {
              subjectHash: keyedHash(
                'authentication-subject',
                subject,
                this.config.auditHashSecret,
              ),
            }
          : {}),
        ...(family ? { sessionFamilyId: family } : {}),
      },
    });
  }
}
