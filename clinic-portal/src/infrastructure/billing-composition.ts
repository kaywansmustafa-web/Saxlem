import "server-only";
import { cookies } from "next/headers";
import {
  BillingReadServices,
  PlatformBillingServices,
} from "@/features/billing/application/billing-services";
import { BackendBillingRepository } from "@/features/billing/data/backend-billing-repository";
import { PortalApiError, safeApiMessage } from "./api/api-error";
import { BackendApiClient } from "./api/api-client";
import { authenticationComposition } from "./auth/composition";
import { portalSessionCookieName } from "./auth/session-cookie";
import { accessTokenNeedsRefresh } from "./auth/session-time";
import { portalConfiguration } from "./config/environment";

export async function billingComposition(requestedOrganizationId?: string) {
  const auth = authenticationComposition();
  const sealed = (await cookies()).get(
    portalSessionCookieName(auth.configuration.environment),
  )?.value;
  const session = await auth.cookie.unseal(sealed);
  if (!session || accessTokenNeedsRefresh(session))
    throw error("unauthorized", 401);
  if (!["clinicManager", "platformAdministrator"].includes(session.role))
    throw error("forbidden", 403);
  const platform = session.role === "platformAdministrator";
  if (platform && session.context !== null) throw error("forbidden", 403);
  if (!platform && !session.context) throw error("forbidden", 403);
  if (
    !platform &&
    requestedOrganizationId &&
    requestedOrganizationId !== session.context!.organizationId
  )
    throw error("forbidden", 403);
  const organizationId = platform
    ? requestedOrganizationId
    : session.context!.organizationId;
  const repository = new BackendBillingRepository(
    new BackendApiClient(portalConfiguration()),
    session,
  );
  return Object.freeze({
    session,
    organizationId,
    read: organizationId
      ? new BillingReadServices(repository, organizationId)
      : null,
    platform: platform
      ? new PlatformBillingServices(repository, organizationId ?? "")
      : null,
  });
}
const error = (kind: "unauthorized" | "forbidden", status: number) =>
  new PortalApiError({
    kind,
    status,
    code:
      kind === "unauthorized"
        ? "PORTAL_SESSION_REQUIRED"
        : "PORTAL_BILLING_FORBIDDEN",
    message: safeApiMessage[kind],
    retryable: false,
  });
