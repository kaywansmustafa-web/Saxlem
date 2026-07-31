import type {
  AuthenticatedSession,
  PortalStaffRole,
  TokenResponse,
} from "@/features/authentication/domain/auth-models";
import type { PortalConfiguration } from "@/infrastructure/config/environment";

export const ids = Object.freeze({
  user: "11111111-1111-4111-8111-111111111111",
  session: "22222222-2222-4222-8222-222222222222",
  organization: "33333333-3333-4333-8333-333333333333",
  clinic: "44444444-4444-4444-8444-444444444444",
  device: "55555555-5555-4555-8555-555555555555",
});

export async function tokenResponse(
  role: PortalStaffRole | "patient" | "unknown" = "receptionist",
  expiresAt = Date.now() + 10 * 60_000,
): Promise<TokenResponse> {
  const tenant =
    role === "platformAdministrator"
      ? {}
      : { org: ids.organization, clinic: ids.clinic };
  const now = Math.floor(Date.now() / 1_000);
  const claims = {
    sub: ids.user,
    sid: ids.session,
    typ: "access",
    iss: "saxlem",
    aud: "saxlem-clients",
    jti: "66666666-6666-4666-8666-666666666666",
    auth_time: now,
    av: 0,
    rv: 0,
    role,
    ...tenant,
    iat: now,
    exp: Math.floor(expiresAt / 1_000),
  };
  const accessToken = [
    { alg: "HS256", typ: "JWT" },
    claims,
    "test-signature",
  ]
    .map((part) =>
      Buffer.from(
        typeof part === "string" ? part : JSON.stringify(part),
      ).toString("base64url"),
    )
    .join(".");
  return {
    accessToken,
    refreshToken: "r".repeat(64),
    expiresInSeconds: 600,
  };
}

export async function session(
  overrides: Partial<AuthenticatedSession> = {},
): Promise<AuthenticatedSession> {
  const tokens = await tokenResponse();
  return {
    userId: ids.user,
    sessionId: ids.session,
    role: "receptionist",
    context: {
      organizationId: ids.organization,
      clinicId: ids.clinic,
    },
    deviceId: ids.device,
    deviceUserAgent: "Saxlem Test Browser",
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    accessExpiresAt: Date.now() + 10 * 60_000,
    sessionExpiresAt: Date.now() + 24 * 60 * 60_000,
    ...overrides,
  };
}

export function configuration(
  overrides: Partial<PortalConfiguration> = {},
): PortalConfiguration {
  return {
    environment: "development",
    configurationWasExplicit: true,
    backendApiUrl: new URL("http://backend.test/"),
    sessionSecret: "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY",
    requestTimeoutMs: 1_000,
    ...overrides,
  };
}
