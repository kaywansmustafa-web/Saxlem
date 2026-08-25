import { z } from "zod";
import { billingComposition } from "@/infrastructure/billing-composition";
import { safeJson, safeRouteError } from "@/app/api/auth/route-response";
import {
  hasBillingSpoofHeaders,
  invalidBillingRequest,
} from "@/app/api/billing-request";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  if (hasBillingSpoofHeaders(request)) return invalidBillingRequest();
  const parsed = z
    .string()
    .uuid()
    .safeParse((await params).organizationId);
  if (!parsed.success) return invalidBillingRequest();
  try {
    const composition = await billingComposition(parsed.data);
    const service = composition.platform;
    if (!service)
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
    return safeJson({
      ok: true,
      assignment: await service.organizationPlan(parsed.data),
    });
  } catch (error) {
    return safeRouteError(error);
  }
}
