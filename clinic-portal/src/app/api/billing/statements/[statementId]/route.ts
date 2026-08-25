import { z } from "zod";
import { billingComposition } from "@/infrastructure/billing-composition";
import { safeJson, safeRouteError } from "@/app/api/auth/route-response";
import {
  hasBillingSpoofHeaders,
  invalidBillingRequest,
} from "@/app/api/billing-request";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ statementId: string }> },
) {
  if (hasBillingSpoofHeaders(request)) return invalidBillingRequest();
  const id = z
    .string()
    .uuid()
    .safeParse((await params).statementId);
  if (!id.success) return invalidBillingRequest();
  try {
    const composition = await billingComposition();
    if (!composition.read && !composition.platform)
      return invalidBillingRequest();
    const service = composition.read ?? composition.platform!;
    return safeJson({ ok: true, statement: await service.statement(id.data) });
  } catch (error) {
    return safeRouteError(error);
  }
}
