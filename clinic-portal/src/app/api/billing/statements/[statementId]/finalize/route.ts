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
    expectedVersion: z.number().int().positive(),
    attemptId: z.string().uuid(),
  })
  .strict();
export async function POST(
  request: Request,
  { params }: { params: Promise<{ statementId: string }> },
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
  const id = z
      .string()
      .uuid()
      .safeParse((await params).statementId),
    json = await readBillingJson(request),
    body = json.ok ? schema.safeParse(json.value) : null;
  if (!id.success || !body?.success) return invalidBillingRequest();
  try {
    const { platform, session } = await billingComposition();
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
    const key = billingOperationKey(
      session,
      body.data.attemptId,
      `billing.statement.finalize:${id.data}`,
      { id: id.data, version: body.data.expectedVersion },
    );
    return safeJson({
      ok: true,
      statement: await platform.finalize(
        id.data,
        body.data.expectedVersion,
        key,
      ),
    });
  } catch (error) {
    return safeRouteError(error);
  }
}
