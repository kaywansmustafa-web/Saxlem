import { z } from "zod";
import { billingComposition } from "@/infrastructure/billing-composition";
import { safeJson, safeRouteError } from "@/app/api/auth/route-response";
import {
  hasBillingSpoofHeaders,
  invalidBillingRequest,
} from "@/app/api/billing-request";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ planId: string }> },
) {
  if (hasBillingSpoofHeaders(request)) return invalidBillingRequest();
  const parsed = z
    .string()
    .uuid()
    .safeParse((await params).planId);
  if (!parsed.success) return invalidBillingRequest();
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
    return safeJson({ ok: true, plan: await platform.plan(parsed.data) });
  } catch (error) {
    return safeRouteError(error);
  }
}
