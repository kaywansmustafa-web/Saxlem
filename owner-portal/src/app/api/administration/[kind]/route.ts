import { randomUUID } from "node:crypto";
import { z } from "zod";
import { clinicSchema, organizationSchema } from "@/data/owner-data";
import { OwnerApiError } from "@/infrastructure/api-client";
import { ownerApi, restoreOwnerSession } from "@/infrastructure/auth";
import { noStoreJson, sameOrigin } from "@/infrastructure/request-security";
const organization = z
  .object({ name: z.string().trim().min(1).max(120) })
  .strict();
const clinic = z
  .object({
    organizationId: z.string().uuid(),
    name: z.string().trim().min(1).max(120),
    code: z
      .string()
      .trim()
      .min(2)
      .max(32)
      .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/u),
    timezone: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .regex(/^[A-Za-z_+-]+(?:\/[A-Za-z0-9_+-]+)+$/u),
  })
  .strict();
export async function POST(
  request: Request,
  { params }: { params: Promise<{ kind: string }> },
): Promise<Response> {
  if (!sameOrigin(request))
    return noStoreJson(
      { ok: false, error: { message: "The request could not be verified." } },
      403,
    );
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    return noStoreJson(
      { ok: false, error: { message: "Use a valid form request." } },
      400,
    );
  const { kind } = await params;
  if (kind !== "organization" && kind !== "clinic")
    return noStoreJson(
      { ok: false, error: { message: "This operation is unavailable." } },
      404,
    );
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return noStoreJson(
      { ok: false, error: { message: "Use a valid JSON request." } },
      400,
    );
  }
  const parsed = (kind === "organization" ? organization : clinic).safeParse(raw);
    if (!parsed.success)
      return noStoreJson(
        { ok: false, error: { message: "Check the entered information." } },
        400,
      );
  const session = await restoreOwnerSession();
  if (!session)
    return noStoreJson(
      { ok: false, error: { message: "Sign in to continue." } },
      401,
    );
  try {
    const data = await ownerApi().request({
      path:
        kind === "organization"
          ? "/api/v1/administration/organizations"
          : "/api/v1/administration/clinics",
      method: "POST",
      body: parsed.data,
      session,
      idempotencyKey: randomUUID(),
      schema: kind === "organization" ? organizationSchema : clinicSchema,
    });
    return noStoreJson({ ok: true, data }, 201);
  } catch (error) {
    const status = error instanceof OwnerApiError && [400, 403, 404, 409, 422, 429].includes(error.status) ? error.status : 503;
    return noStoreJson(
      {
        ok: false,
        error: { message: "The record could not be created safely." },
      },
      status,
    );
  }
}
