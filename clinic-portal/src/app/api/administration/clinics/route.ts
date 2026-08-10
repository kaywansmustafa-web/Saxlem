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

const cursor = z
  .string()
  .min(1)
  .max(2048)
  .regex(/^[^\s\u0000-\u001f\u007f]+$/u);
const listSchema = z
  .object({
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
    cursor: cursor.optional(),
    organizationId: z.string().uuid().optional(),
  })
  .strict();
const createSchema = z
  .object({
    organizationId: z.string().uuid(),
    name: z.string().trim().min(1).max(120),
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(2)
      .max(32)
      .regex(/^[A-Z0-9][A-Z0-9_-]*$/u),
    timezone: z
      .string()
      .trim()
      .min(3)
      .max(100)
      .regex(/^[A-Za-z_+-]+(?:\/[A-Za-z0-9_+-]+)+$/u),
    attemptId: z.string().uuid(),
  })
  .strict();

export async function GET(request: Request) {
  if (hasBrowserTenantHeaders(request)) return invalidAdministrationRequest();
  try {
    const parsed = listSchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    if (!parsed.success) return invalidAdministrationRequest();
    return safeJson({
      ok: true,
      page: await (
        await administrationComposition()
      ).services.listClinics(parsed.data),
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
    const { attemptId, ...input } = parsed.data;
    const { services, session } = await administrationComposition();
    const key = administrationOperationKey(
      session,
      attemptId,
      "clinic.create",
      input,
    );
    return safeJson(
      { ok: true, clinic: await services.createClinic(input, key) },
      201,
    );
  } catch (error) {
    return safeRouteError(error);
  }
}
