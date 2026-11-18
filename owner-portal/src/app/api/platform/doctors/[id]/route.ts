import { z } from "zod";
import { OwnerApiError } from "@/infrastructure/api-client";
import { ownerApi, restoreOwnerSession } from "@/infrastructure/auth";
import { noStoreJson, sameOrigin } from "@/infrastructure/request-security";
const body = z
  .object({
    displayName: z.string().trim().min(1).max(120),
    biography: z.string().trim().max(4000),
    yearsOfExperience: z.number().int().min(0).max(80),
    languages: z.array(z.string().trim().min(2).max(40)).max(12),
    status: z.enum(["active", "inactive", "archived"]),
    consultationFeeIqd: z.number().int().min(0).max(5_000_000).nullable(),
    followUpFeeIqd: z.number().int().min(0).max(5_000_000).nullable(),
    version: z.number().int().positive(),
  })
  .strict();
const response = z
  .object({
    id: z.string().uuid(),
    status: z.string(),
    version: z.number().int(),
    displayName: z.string(),
  })
  .strict();
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!sameOrigin(request))
    return noStoreJson(
      { ok: false, error: { message: "The request could not be verified." } },
      403,
    );
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return noStoreJson(
      { ok: false, error: { message: "Use a valid form request." } },
      400,
    );
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success)
    return noStoreJson(
      { ok: false, error: { message: "Doctor not found." } },
      404,
    );
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return noStoreJson(
      { ok: false, error: { message: "Use valid JSON." } },
      400,
    );
  }
  const parsed = body.safeParse(raw);
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
    return noStoreJson({
      ok: true,
      data: await ownerApi().request({
        path: `/api/v1/platform/doctors/${id}`,
        method: "PATCH",
        body: parsed.data,
        session,
        schema: response,
      }),
    });
  } catch (error) {
    const status =
      error instanceof OwnerApiError &&
      [400, 403, 404, 409, 422, 429].includes(error.status)
        ? error.status
        : 503;
    return noStoreJson(
      {
        ok: false,
        error: {
          message:
            status === 409
              ? "This doctor changed. Refresh before saving again."
              : "The doctor could not be updated safely.",
        },
      },
      status,
    );
  }
}
