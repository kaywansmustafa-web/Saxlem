import "server-only";
import { createHmac } from "node:crypto";
import type { AuthenticatedSession } from "@/features/authentication/domain/auth-models";
import { safeJson } from "./auth/route-response";
import { portalConfiguration } from "@/infrastructure/config/environment";

const forbidden = [
  "authorization",
  "x-organization-id",
  "x-clinic-id",
  "organization-id",
  "clinic-id",
  "x-role",
  "role",
];
export const hasBillingSpoofHeaders = (request: Request) =>
  forbidden.some((x) => request.headers.has(x));
export const invalidBillingRequest = () =>
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
export async function readBillingJson(request: Request) {
  if (
    request.headers
      .get("content-type")
      ?.split(";", 1)[0]
      ?.trim()
      .toLowerCase() !== "application/json"
  )
    return { ok: false as const };
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 16384) return { ok: false as const };
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > 16384)
      return { ok: false as const };
    return { ok: true as const, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false as const };
  }
}
export function billingOperationKey(
  session: AuthenticatedSession,
  attemptId: string,
  operation: string,
  body: object,
) {
  return `portal-billing-${createHmac(
    "sha256",
    portalConfiguration().sessionSecret,
  )
    .update(
      JSON.stringify({
        actorId: session.userId,
        sessionId: session.sessionId,
        attemptId,
        operation,
        body,
      }),
    )
    .digest("hex")}`;
}
