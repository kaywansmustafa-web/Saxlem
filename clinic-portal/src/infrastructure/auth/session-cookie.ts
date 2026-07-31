import "server-only";

import { createHash } from "node:crypto";
import { EncryptJWT, jwtDecrypt } from "jose";
import { z } from "zod";
import type { AuthenticatedSession } from "@/features/authentication/domain/auth-models";
import type { PortalConfiguration } from "@/infrastructure/config/environment";

const SESSION_LIFETIME_SECONDS = 30 * 24 * 60 * 60;

const sealedSessionSchema = z
  .object({
    userId: z.string().uuid(),
    sessionId: z.string().uuid(),
    role: z.enum([
      "receptionist",
      "doctor",
      "clinicManager",
      "platformAdministrator",
    ]),
    context: z
      .object({
        organizationId: z.string().uuid(),
        clinicId: z.string().uuid(),
      })
      .strict()
      .nullable(),
    deviceId: z.string().uuid(),
    deviceUserAgent: z.string().min(1).max(512),
    accessToken: z.string().min(32),
    refreshToken: z.string().min(32),
    accessExpiresAt: z.number().int().positive(),
    sessionExpiresAt: z.number().int().positive(),
  })
  .passthrough();

export interface PortalCookieOptions {
  readonly httpOnly: true;
  readonly sameSite: "strict";
  readonly secure: boolean;
  readonly path: "/";
  readonly maxAge: number;
  readonly priority: "high";
}

export function portalSessionCookieName(
  environment: PortalConfiguration["environment"],
): string {
  return environment === "production"
    ? "__Host-saxlem_portal_session"
    : "saxlem_portal_session";
}

export function portalSessionCookieOptions(
  environment: PortalConfiguration["environment"],
): PortalCookieOptions {
  return Object.freeze({
    httpOnly: true,
    sameSite: "strict",
    secure: environment !== "development",
    path: "/",
    maxAge: SESSION_LIFETIME_SECONDS,
    priority: "high",
  });
}

export function clearedPortalSessionCookieOptions(
  environment: PortalConfiguration["environment"],
): PortalCookieOptions {
  return Object.freeze({
    ...portalSessionCookieOptions(environment),
    maxAge: 0,
  });
}

export class PortalSessionCookie {
  private readonly key: Uint8Array;

  constructor(private readonly configuration: PortalConfiguration) {
    this.key = new Uint8Array(
      createHash("sha256").update(configuration.sessionSecret, "utf8").digest(),
    );
  }

  async seal(session: AuthenticatedSession): Promise<string> {
    const nowSeconds = Math.floor(Date.now() / 1_000);
    const maximumExpiry = nowSeconds + SESSION_LIFETIME_SECONDS;
    const sessionExpiry = Math.min(
      Math.floor(session.sessionExpiresAt / 1_000),
      maximumExpiry,
    );
    return new EncryptJWT({ ...session })
      .setProtectedHeader({ alg: "dir", enc: "A256GCM", typ: "JWT" })
      .setIssuedAt(nowSeconds)
      .setExpirationTime(sessionExpiry)
      .setIssuer("saxlem-clinic-portal")
      .setAudience("saxlem-clinic-portal")
      .encrypt(this.key);
  }

  async unseal(
    value: string | undefined,
  ): Promise<AuthenticatedSession | null> {
    if (!value) return null;
    try {
      const { payload } = await jwtDecrypt(value, this.key, {
        issuer: "saxlem-clinic-portal",
        audience: "saxlem-clinic-portal",
        keyManagementAlgorithms: ["dir"],
        contentEncryptionAlgorithms: ["A256GCM"],
      });
      const parsed = sealedSessionSchema.safeParse(payload);
      if (!parsed.success || parsed.data.sessionExpiresAt <= Date.now()) {
        return null;
      }
      return Object.freeze({
        ...parsed.data,
        context: parsed.data.context
          ? Object.freeze({ ...parsed.data.context })
          : null,
      });
    } catch {
      return null;
    }
  }
}

export function safeReturnPath(
  candidate: unknown,
  fallback = "/en/dashboard",
): string {
  if (typeof candidate !== "string" || candidate.length > 512) return fallback;
  if (
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    /[\u0000-\u001f\u007f]/u.test(candidate)
  ) {
    return fallback;
  }
  try {
    const parsed = new URL(candidate, "https://portal.saxlem.invalid");
    const decodedPath = decodeURIComponent(parsed.pathname);
    return parsed.origin === "https://portal.saxlem.invalid" &&
      !parsed.pathname.startsWith("/api/") &&
      parsed.pathname !== "/api" &&
      !decodedPath.startsWith("/api/") &&
      decodedPath !== "/api" &&
      !/[\u0000-\u001f\u007f]/u.test(decodedPath)
      ? `${parsed.pathname}${parsed.search}${parsed.hash}`
      : fallback;
  } catch {
    return fallback;
  }
}
