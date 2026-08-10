import "server-only";

import { createHmac } from "node:crypto";
import { safeJson } from "@/app/api/auth/route-response";
import type { AuthenticatedSession } from "@/features/authentication/domain/auth-models";
import { portalConfiguration } from "@/infrastructure/config/environment";

const maximumBodyBytes = 16_384;
const forbiddenTenantHeaders = [
  "x-organization-id",
  "x-clinic-id",
  "organizationid",
  "clinicid",
];

export const invalidAdministrationRequest = () =>
  safeJson(
    {
      ok: false,
      error: {
        code: "PORTAL_VALIDATION_FAILED",
        message: "Check the information and try again.",
      },
    },
    400,
  );

export function hasBrowserTenantHeaders(request: Request): boolean {
  return forbiddenTenantHeaders.some((name) => request.headers.has(name));
}

export async function readAdministrationJson(
  request: Request,
): Promise<{ ok: true; value: unknown } | { ok: false }> {
  const contentType = request.headers
    .get("content-type")
    ?.split(";", 1)[0]
    ?.trim()
    .toLowerCase();
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (
    contentType !== "application/json" ||
    (Number.isFinite(declared) && declared > maximumBodyBytes)
  )
    return { ok: false };
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > maximumBodyBytes)
      return { ok: false };
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false };
  }
}

export function administrationOperationKey(
  session: AuthenticatedSession,
  attemptId: string,
  operation: string,
  body: object,
): string {
  const secret = portalConfiguration().sessionSecret;
  const canonical = JSON.stringify({
    actorId: session.userId,
    sessionId: session.sessionId,
    attemptId,
    operation,
    body,
  });
  return `portal-admin-${createHmac("sha256", secret).update(canonical).digest("hex")}`;
}
