import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { IdentityRole } from '@prisma/client';
import type { Request } from 'express';
import { BACKEND_CONFIGURATION } from '../../../config/configuration.module';
import type { BackendConfiguration } from '../../../config/environment';
import type { AuthenticatedPrincipal } from '../../../common/auth/principal';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { capabilitiesFor } from '../application/capabilities';
import { REQUIRED_CAPABILITIES } from './require-capabilities.decorator';

interface AccessClaims {
  sub: string;
  sid: string;
  jti: string;
  typ: 'access';
  auth_time: number;
  av: number;
  rv: number;
  role: IdentityRole;
  org?: string;
  clinic?: string;
}

export interface AuthenticatedRequest extends Request {
  principal?: AuthenticatedPrincipal;
  tenant?: { organizationId: string; clinicId?: string };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
    @Inject(BACKEND_CONFIGURATION)
    private readonly config: BackendConfiguration,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.bearer(request);
    let claims: AccessClaims;
    try {
      claims = await this.jwt.verifyAsync<AccessClaims>(token, {
        secret: this.config.accessTokenSecret,
        algorithms: ['HS256'],
        issuer: 'saxlem',
        audience: 'saxlem-clients',
      });
    } catch {
      throw new UnauthorizedException('Access token is invalid.');
    }
    if (
      claims.typ !== 'access' ||
      !claims.sub ||
      !claims.sid ||
      !claims.jti ||
      !Number.isInteger(claims.auth_time)
    )
      throw new UnauthorizedException('Access token is invalid.');
    const session = await this.prisma.db.refreshSession.findUnique({
      where: { id: claims.sid },
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
    if (
      !session ||
      session.userId !== claims.sub ||
      session.user.status !== 'active' ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      session.family.revokedAt ||
      session.family.expiresAt <= new Date() ||
      session.user.authorizationVersion !== claims.av ||
      session.user.roleVersion !== claims.rv ||
      session.family.role !== claims.role ||
      session.family.organizationId !== (claims.org ?? null) ||
      session.family.clinicId !== (claims.clinic ?? null)
    )
      throw new UnauthorizedException('Access token is no longer valid.');
    const assignment = session.user.roles.some(
      (role) =>
        role.role === claims.role &&
        role.organizationId === (claims.org ?? null) &&
        role.clinicId === (claims.clinic ?? null),
    );
    if (!assignment)
      throw new ForbiddenException('Role assignment is no longer active.');
    if (claims.role === 'doctor' && !session.user.staffAccount?.doctor)
      throw new ForbiddenException('Doctor eligibility is no longer active.');
    if (
      claims.role === 'platformAdministrator' &&
      !session.user.roles.some(
        (role) =>
          role.role === 'platformAdministrator' &&
          !role.organizationId &&
          !role.clinicId,
      )
    )
      throw new ForbiddenException('Platform role is no longer active.');
    if (claims.org && claims.clinic) {
      const membership = await this.prisma.db.clinicMembership.findFirst({
        where: {
          userId: claims.sub,
          organizationId: claims.org,
          clinicId: claims.clinic,
          role: claims.role,
          status: 'active',
          organization: { status: 'active' },
          clinic: { status: 'active' },
        },
      });
      if (!membership)
        throw new ForbiddenException('Tenant membership is not active.');
      const requestedOrganization = request.get('x-organization-id');
      const requestedClinic = request.get('x-clinic-id');
      if (
        (requestedOrganization && requestedOrganization !== claims.org) ||
        (requestedClinic && requestedClinic !== claims.clinic)
      )
        throw new ForbiddenException('Tenant context does not match.');
      request.tenant = {
        organizationId: claims.org,
        clinicId: claims.clinic,
      };
    } else if (
      claims.role !== 'patient' &&
      claims.role !== 'platformAdministrator'
    ) {
      throw new ForbiddenException('Tenant context is required.');
    }
    const granted = capabilitiesFor(claims.role);
    const required =
      this.reflector.getAllAndOverride<string[]>(REQUIRED_CAPABILITIES, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];
    if (!required.every((capability) => granted.has(capability)))
      throw new ForbiddenException('Required capability is unavailable.');
    request.principal = {
      id: claims.sub,
      kind:
        claims.role === 'patient'
          ? 'patient'
          : claims.role === 'platformAdministrator'
            ? 'platformAdministrator'
            : 'staff',
      sessionId: claims.sid,
      capabilities: granted,
    };
    return true;
  }

  private bearer(request: Request): string {
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token)
      throw new UnauthorizedException('Bearer access token is required.');
    return token;
  }
}
