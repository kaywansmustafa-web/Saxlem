import "server-only";

import { cookies } from "next/headers";
import type { AuthenticatedSession } from "@/features/authentication/domain/auth-models";
import { PortalApiError, safeApiMessage } from "@/infrastructure/api/api-error";
import { authenticationComposition } from "./composition";
import { portalSessionCookieName } from "./session-cookie";
import { accessTokenNeedsRefresh } from "./session-time";

export async function requirePlatformAdministratorSession(): Promise<AuthenticatedSession> {
  const composition = authenticationComposition();
  const value = (await cookies()).get(
    portalSessionCookieName(composition.configuration.environment),
  )?.value;
  const session = await composition.cookie.unseal(value);
  if (!session || accessTokenNeedsRefresh(session)) throw unauthorized();
  if (session.role !== "platformAdministrator" || session.context !== null) {
    throw new PortalApiError({
      kind: "forbidden",
      status: 403,
      code: "PORTAL_ADMINISTRATION_FORBIDDEN",
      message: safeApiMessage.forbidden,
      retryable: false,
    });
  }
  return session;
}

const unauthorized = () =>
  new PortalApiError({
    kind: "unauthorized",
    status: 401,
    code: "PORTAL_SESSION_REQUIRED",
    message: safeApiMessage.unauthorized,
    retryable: false,
  });
