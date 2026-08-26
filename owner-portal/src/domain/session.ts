import "server-only";

import { decodeJwt, decodeProtectedHeader } from "jose";
import { z } from "zod";

export interface OwnerSession {
  readonly userId: string;
  readonly sessionId: string;
  readonly deviceId: string;
  readonly userAgent: string;
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly accessExpiresAt: number;
  readonly sessionExpiresAt: number;
}

export const tokenResponseSchema = z
  .object({
    accessToken: z.string().min(32),
    refreshToken: z.string().min(32),
    expiresInSeconds: z.number().int().min(1).max(3600),
  })
  .strict();
export type TokenResponse = z.infer<typeof tokenResponseSchema>;

const claimsSchema = z
  .object({
    sub: z.string().uuid(),
    sid: z.string().uuid(),
    typ: z.literal("access"),
    iss: z.literal("saxlem"),
    aud: z.union([z.literal("saxlem-clients"), z.array(z.string())]),
    role: z.literal("platformAdministrator"),
    org: z.never().optional(),
    clinic: z.never().optional(),
    exp: z.number().int().positive(),
    iat: z.number().int().positive(),
  })
  .passthrough();

export function ownerSessionFromTokens(
  response: TokenResponse,
  deviceId: string,
  userAgent: string,
  now = Date.now(),
): OwnerSession {
  let raw: unknown;
  try {
    const header = decodeProtectedHeader(response.accessToken);
    if (header.alg !== "HS256" || (header.typ && header.typ !== "JWT"))
      throw new Error();
    raw = decodeJwt(response.accessToken);
  } catch {
    throw new Error("Authentication could not be completed.");
  }
  const claims = claimsSchema.safeParse(raw);
  if (
    !claims.success ||
    (Array.isArray(claims.data.aud) &&
      !claims.data.aud.includes("saxlem-clients")) ||
    claims.data.exp * 1000 <= now ||
    claims.data.exp * 1000 > now + 3_600_000
  ) {
    throw new Error("Authentication could not be completed.");
  }
  return Object.freeze({
    userId: claims.data.sub,
    sessionId: claims.data.sid,
    deviceId,
    userAgent,
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    accessExpiresAt: claims.data.exp * 1000,
    sessionExpiresAt: now + 30 * 24 * 60 * 60 * 1000,
  });
}
