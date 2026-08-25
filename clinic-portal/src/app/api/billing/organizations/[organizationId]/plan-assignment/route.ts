import { z } from "zod";
import { billingComposition } from "@/infrastructure/billing-composition";
import { isSameOriginMutation } from "@/infrastructure/auth/request-security";
import { safeJson, safeRouteError } from "@/app/api/auth/route-response";
import {
  billingOperationKey,
  hasBillingSpoofHeaders,
  invalidBillingRequest,
  readBillingJson,
} from "@/app/api/billing-request";
const schema = z
  .object({
    planId: z.string().uuid(),
    effectiveFrom: z.string().datetime({ offset: true }),
    expectedVersion: z.number().int().positive().nullable(),
    attemptId: z.string().uuid(),
  })
  .strict();
export async function POST(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  if (!isSameOriginMutation(request))
    return safeJson(
      {
        ok: false,
        error: {
          code: "PORTAL_ORIGIN_REJECTED",
          message: "The request could not be verified.",
        },
      },
      403,
    );
  if (hasBillingSpoofHeaders(request)) return invalidBillingRequest();
  const organization = z
      .string()
      .uuid()
      .safeParse((await params).organizationId),
    json = await readBillingJson(request),
    body = json.ok ? schema.safeParse(json.value) : null;
  if (!organization.success || !body?.success) return invalidBillingRequest();
  try {
    const { platform, session } = await billingComposition(organization.data);
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
    const input = {
      organizationId: organization.data,
      planId: body.data.planId,
      effectiveFrom: body.data.effectiveFrom,
      expectedVersion: body.data.expectedVersion,
    };
    const key = billingOperationKey(
      session,
      body.data.attemptId,
      "billing.plan.assign",
      input,
    );
    return safeJson(
      { ok: true, assignment: await platform.assign(input, key) },
      201,
    );
  } catch (error) {
    return safeRouteError(error);
  }
}
