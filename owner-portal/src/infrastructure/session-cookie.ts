import "server-only";

import { createHash } from "node:crypto";
import { EncryptJWT, jwtDecrypt } from "jose";
import { z } from "zod";
import type { OwnerSession } from "@/domain/session";
import type { OwnerConfiguration } from "./config";

const sessionSchema = z
  .object({
    userId: z.string().uuid(),
    sessionId: z.string().uuid(),
    deviceId: z.string().uuid(),
    userAgent: z.string().min(1).max(512),
    accessToken: z.string().min(32),
    refreshToken: z.string().min(32),
    accessExpiresAt: z.number().int().positive(),
    sessionExpiresAt: z.number().int().positive(),
  })
  .passthrough();

export const cookieName = (
  environment: OwnerConfiguration["environment"],
): string =>
  environment === "production"
    ? "__Host-saxlem_owner_session"
    : "saxlem_owner_session";
export const cookieOptions = (
  environment: OwnerConfiguration["environment"],
  maxAge = 30 * 24 * 60 * 60,
) => ({
  httpOnly: true as const,
  sameSite: "strict" as const,
  secure: environment !== "development",
  path: "/",
  maxAge,
  priority: "high" as const,
});

export class OwnerSessionCookie {
  private readonly key: Uint8Array;
  constructor(private readonly configuration: OwnerConfiguration) {
    this.key = new Uint8Array(
      createHash("sha256").update(configuration.sessionSecret, "utf8").digest(),
    );
  }
  async seal(session: OwnerSession): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    return new EncryptJWT({ ...session })
      .setProtectedHeader({ alg: "dir", enc: "A256GCM", typ: "JWT" })
      .setIssuedAt(now)
      .setExpirationTime(
        Math.min(
          Math.floor(session.sessionExpiresAt / 1000),
          now + 30 * 24 * 60 * 60,
        ),
      )
      .setIssuer("saxlem-owner-portal")
      .setAudience("saxlem-owner-portal")
      .encrypt(this.key);
  }
  async unseal(value: string | undefined): Promise<OwnerSession | null> {
    if (!value) return null;
    try {
      const { payload } = await jwtDecrypt(value, this.key, {
        issuer: "saxlem-owner-portal",
        audience: "saxlem-owner-portal",
        keyManagementAlgorithms: ["dir"],
        contentEncryptionAlgorithms: ["A256GCM"],
      });
      const parsed = sessionSchema.safeParse(payload);
      if (!parsed.success || parsed.data.sessionExpiresAt <= Date.now())
        return null;
      return Object.freeze({
        userId: parsed.data.userId,
        sessionId: parsed.data.sessionId,
        deviceId: parsed.data.deviceId,
        userAgent: parsed.data.userAgent,
        accessToken: parsed.data.accessToken,
        refreshToken: parsed.data.refreshToken,
        accessExpiresAt: parsed.data.accessExpiresAt,
        sessionExpiresAt: parsed.data.sessionExpiresAt,
      });
    } catch {
      return null;
    }
  }
}

export function safeReturnPath(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length > 512 ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f]/u.test(value)
  )
    return "/dashboard";
  try {
    const url = new URL(value, "https://owner.saxlem.invalid");
    const decodedPath = decodeURIComponent(url.pathname);
    return url.origin === "https://owner.saxlem.invalid" &&
      !url.pathname.startsWith("/api") &&
      !decodedPath.startsWith("/api") &&
      !/[\u0000-\u001f\u007f]/u.test(decodedPath)
      ? `${url.pathname}${url.search}`
      : "/dashboard";
  } catch {
    return "/dashboard";
  }
}
