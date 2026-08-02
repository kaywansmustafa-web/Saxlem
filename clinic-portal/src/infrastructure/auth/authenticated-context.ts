import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n";
import type { AuthenticatedSession } from "@/features/authentication/domain/auth-models";
import { authenticationComposition } from "./composition";
import { portalSessionCookieName } from "./session-cookie";
import { accessTokenNeedsRefresh } from "./session-time";
import { PortalApiError, safeApiMessage } from "@/infrastructure/api/api-error";

export async function requireClinicalSession(locale?: Locale): Promise<AuthenticatedSession> {
  const composition = authenticationComposition();
  const value = (await cookies()).get(portalSessionCookieName(composition.configuration.environment))?.value;
  const session = await composition.cookie.unseal(value);
  if (!session) {
    if (locale) redirect(`/${locale}/login`);
    throw unauthorized();
  }
  if (accessTokenNeedsRefresh(session)) {
    if (locale) redirect(`/api/auth/continue?returnPath=/${locale}/dashboard`);
    throw unauthorized();
  }
  if (!session.context || !["receptionist", "clinicManager"].includes(session.role)) {
    throw new PortalApiError({kind:"forbidden",status:403,code:"PORTAL_CLINICAL_ACCESS_FORBIDDEN",message:safeApiMessage.forbidden,retryable:false});
  }
  return session;
}
const unauthorized=()=>new PortalApiError({kind:"unauthorized",status:401,code:"PORTAL_SESSION_REQUIRED",message:safeApiMessage.unauthorized,retryable:false});
