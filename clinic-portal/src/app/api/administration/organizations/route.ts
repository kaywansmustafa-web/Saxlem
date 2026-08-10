import { z } from "zod";
import { administrationComposition } from "@/infrastructure/administration-composition";
import { isSameOriginMutation } from "@/infrastructure/auth/request-security";
import { safeJson, safeRouteError } from "@/app/api/auth/route-response";
import {
  administrationOperationKey,
  hasBrowserTenantHeaders,
  invalidAdministrationRequest,
  readAdministrationJson,
} from "@/app/api/administration-request";

const listSchema = z
  .object({
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
    cursor: z
      .string()
      .min(1)
      .max(2048)
      .regex(/^[^\s\u0000-\u001f\u007f]+$/u)
      .optional(),
  })
  .strict();
const createSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    attemptId: z.string().uuid(),
  })
  .strict();

export async function GET(request: Request) {
  if (hasBrowserTenantHeaders(request)) return invalidAdministrationRequest();
  try {
    const url = new URL(request.url);
    const parsed = listSchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return invalidAdministrationRequest();
    const { services } = await administrationComposition();
    return safeJson({
      ok: true,
      page: await services.listOrganizations(parsed.data),
    });
  } catch (error) {
    return safeRouteError(error);
  }
}

export async function POST(request: Request) {
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
  if (hasBrowserTenantHeaders(request)) return invalidAdministrationRequest();
  try {
    const json = await readAdministrationJson(request);
    const parsed = json.ok ? createSchema.safeParse(json.value) : null;
    if (!parsed?.success) return invalidAdministrationRequest();
    const { services, session } = await administrationComposition();
    const input = { name: parsed.data.name };
    const key = administrationOperationKey(
      session,
      parsed.data.attemptId,
      "organization.create",
      input,
    );
    return safeJson(
      { ok: true, organization: await services.createOrganization(input, key) },
      201,
    );
  } catch (error) {
    return safeRouteError(error);
  }
}
