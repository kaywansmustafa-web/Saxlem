import "server-only";

import { decodeJwt, decodeProtectedHeader } from "jose";
import { z } from "zod";
import {
  portalStaffRoleSchema,
  type PortalStaffRole,
  type PublicPortalSession,
  type TenantContext,
} from "./public-auth-models";

export type { PortalStaffRole, PublicPortalSession, TenantContext } from "./public-auth-models";

const backendRoleSchema = z.enum([
  "patient",
  "receptionist",
  "doctor",
  "clinicManager",
  "platformAdministrator",
]);

export const tokenResponseSchema = z
  .object({
    accessToken: z.string().min(32),
    refreshToken: z.string().min(32),
    expiresInSeconds: z.number().int().min(1).max(3_600),
  })
  .strict();

export type TokenResponse = Readonly<z.infer<typeof tokenResponseSchema>>;

const accessClaimsSchema = z
  .object({
    sub: z.string().uuid(),
    sid: z.string().uuid(),
    typ: z.literal("access"),
    iss: z.literal("saxlem"),
    aud: z.union([z.literal("saxlem-clients"), z.array(z.string())]),
    jti: z.string().uuid(),
    auth_time: z.number().int().nonnegative(),
    av: z.number().int().nonnegative(),
    rv: z.number().int().nonnegative(),
    role: backendRoleSchema,
    org: z.string().uuid().optional(),
    clinic: z.string().uuid().optional(),
    exp: z.number().int().positive(),
    iat: z.number().int().positive(),
  })
  .passthrough();

export interface AuthenticatedSession {
  readonly userId: string;
  readonly sessionId: string;
  readonly role: PortalStaffRole;
  readonly context: TenantContext | null;
  readonly deviceId: string;
  readonly deviceUserAgent: string;
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly accessExpiresAt: number;
  readonly sessionExpiresAt: number;
}

export class AuthenticationContractError extends Error {
  constructor() {
    super("Authentication could not be completed.");
    this.name = "AuthenticationContractError";
  }
}

export function parseStaffRole(value: unknown): PortalStaffRole {
  const role = portalStaffRoleSchema.safeParse(value);
  if (!role.success) {
    throw new AuthenticationContractError();
  }
  return role.data;
}

export function sessionFromTokenResponse(
  response: TokenResponse,
  deviceId: string,
  deviceUserAgent: string,
  now = Date.now(),
): AuthenticatedSession {
  let decoded: unknown;
  try {
    const header = decodeProtectedHeader(response.accessToken);
    if (header.alg !== "HS256" || (header.typ && header.typ !== "JWT")) {
      throw new AuthenticationContractError();
    }
    decoded = decodeJwt(response.accessToken);
  } catch {
    throw new AuthenticationContractError();
  }

  const claims = accessClaimsSchema.safeParse(decoded);
  if (
    !claims.success ||
    (Array.isArray(claims.data.aud) &&
      !claims.data.aud.includes("saxlem-clients")) ||
    claims.data.exp * 1_000 <= now ||
    claims.data.exp * 1_000 > now + 3_600_000
  ) {
    throw new AuthenticationContractError();
  }

  const role = parseStaffRole(claims.data.role);
  const requiresTenant = role !== "platformAdministrator";
  const hasCompleteTenant = Boolean(claims.data.org && claims.data.clinic);
  if (requiresTenant !== hasCompleteTenant) {
    throw new AuthenticationContractError();
  }

  const context = hasCompleteTenant
    ? Object.freeze({
        organizationId: claims.data.org!,
        clinicId: claims.data.clinic!,
      })
    : null;

  return Object.freeze({
    userId: claims.data.sub,
    sessionId: claims.data.sid,
    role,
    context,
    deviceId,
    deviceUserAgent,
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    accessExpiresAt: claims.data.exp * 1_000,
    sessionExpiresAt: now + 30 * 24 * 60 * 60 * 1_000,
  });
}

export function publicSession(
  session: AuthenticatedSession,
): PublicPortalSession {
  return Object.freeze({
    authenticated: true,
    role: session.role,
    ...(session.context
      ? {
          organizationId: session.context.organizationId,
          clinicId: session.context.clinicId,
        }
      : {}),
    accessExpiresAt: new Date(session.accessExpiresAt).toISOString(),
  });
}
