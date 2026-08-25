import { billingComposition } from "@/infrastructure/billing-composition";
import { safeJson, safeRouteError } from "@/app/api/auth/route-response";
import {
  hasBillingSpoofHeaders,
  invalidBillingRequest,
} from "@/app/api/billing-request";
export async function GET(request: Request) {
  if (hasBillingSpoofHeaders(request)) return invalidBillingRequest();
  try {
    const { platform } = await billingComposition();
    if (!platform)
      return safeJson(
        {
          ok: false,
          error: {
            code: "PORTAL_BILLING_FORBIDDEN",
            message: "You do not have access.",
          },
        },
        403,
      );
    return safeJson({ ok: true, plans: await platform.plans() });
  } catch (error) {
    return safeRouteError(error);
  }
}
