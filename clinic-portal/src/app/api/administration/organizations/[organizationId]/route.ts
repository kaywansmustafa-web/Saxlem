import { z } from "zod";
import { administrationComposition } from "@/infrastructure/administration-composition";
import { safeJson, safeRouteError } from "@/app/api/auth/route-response";
import {
  hasBrowserTenantHeaders,
  invalidAdministrationRequest,
} from "@/app/api/administration-request";
const idSchema = z.string().uuid();
export async function GET(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  if (hasBrowserTenantHeaders(request)) return invalidAdministrationRequest();
  try {
    const id = idSchema.safeParse((await params).organizationId);
    if (!id.success) return invalidAdministrationRequest();
    return safeJson({
      ok: true,
      organization: await (
        await administrationComposition()
      ).services.getOrganization(id.data),
    });
  } catch (error) {
    return safeRouteError(error);
  }
}
