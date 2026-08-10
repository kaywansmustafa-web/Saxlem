import { z } from "zod";
import { billingComposition } from "@/infrastructure/billing-composition";
import { safeJson, safeRouteError } from "@/app/api/auth/route-response";
import {
  hasBillingSpoofHeaders,
  invalidBillingRequest,
} from "@/app/api/billing-request";
const schema = z
  .object({
    organizationId: z.string().uuid().optional(),
    pageSize: z.coerce.number().int().min(1).max(100).default(50),
    cursor: z
      .string()
      .min(1)
      .max(2048)
      .regex(/^[\x21-\x7e]+$/u)
      .optional(),
  })
  .strict();
export async function GET(request: Request) {
  if (hasBillingSpoofHeaders(request)) return invalidBillingRequest();
  const parsed = schema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success) return invalidBillingRequest();
  try {
    const composition = await billingComposition(parsed.data.organizationId);
    if (!composition.read) return invalidBillingRequest();
    return safeJson({
      ok: true,
      page: await composition.read.listCommissions(
        parsed.data.pageSize,
        parsed.data.cursor,
      ),
    });
  } catch (error) {
    return safeRouteError(error);
  }
}
