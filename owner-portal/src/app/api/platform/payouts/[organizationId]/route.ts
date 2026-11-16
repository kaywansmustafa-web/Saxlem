import { z } from "zod";
import { payoutSchema } from "@/data/owner-data";
import { OwnerApiError } from "@/infrastructure/api-client";
import { ownerApi, restoreOwnerSession } from "@/infrastructure/auth";
import { noStoreJson, sameOrigin } from "@/infrastructure/request-security";

const body = z
  .object({
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
    expectedNetPayableIqd: z.number().int(),
    reference: z.string().trim().min(1).max(120),
    note: z.string().trim().max(500).optional(),
  })
  .strict();

/** Records a month's settlement with an organization as paid. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> },
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
  const { organizationId } = await params;
  if (!z.string().uuid().safeParse(organizationId).success)
    return noStoreJson(
      { ok: false, error: { message: "Organization not found." } },
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
    const data = await ownerApi().request({
      path: `/api/v1/platform/organizations/${organizationId}/payouts`,
      method: "POST",
      session,
      body: parsed.data,
      schema: payoutSchema,
    });
    return noStoreJson({ ok: true, data });
  } catch (error) {
    const status = error instanceof OwnerApiError ? error.status : 503;
    return noStoreJson(
      {
        ok: false,
        error: {
          message:
            status === 409
              ? "The amounts changed or this month is already settled. Refresh and check again."
              : "The settlement could not be recorded.",
        },
      },
      [400, 403, 404, 409].includes(status) ? status : 503,
    );
  }
}
