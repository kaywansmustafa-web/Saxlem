import { z } from "zod";
import { doctorPayoutProfileSchema } from "@/data/owner-data";
import { OwnerApiError } from "@/infrastructure/api-client";
import { ownerApi, restoreOwnerSession } from "@/infrastructure/auth";
import { noStoreJson, sameOrigin } from "@/infrastructure/request-security";

const body = z
  .object({
    payoutAccountName: z.string().trim().max(200).nullable().optional(),
    payoutAccountNumber: z
      .string()
      .regex(/^[A-Za-z0-9 ]{4,64}$/)
      .nullable()
      .optional(),
  })
  .strict();

/** Sets where Saxlem sends one doctor's monthly payout. */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ organizationId: string; doctorId: string }> },
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
  const { organizationId, doctorId } = await params;
  if (
    !z.string().uuid().safeParse(organizationId).success ||
    !z.string().uuid().safeParse(doctorId).success
  )
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
    const data = await ownerApi().request({
      path: `/api/v1/platform/organizations/${organizationId}/doctors/${doctorId}/payout-profile`,
      method: "PUT",
      session,
      body: parsed.data,
      schema: doctorPayoutProfileSchema,
    });
    return noStoreJson({ ok: true, data });
  } catch (error) {
    const status = error instanceof OwnerApiError ? error.status : 503;
    return noStoreJson(
      { ok: false, error: { message: "The settings could not be saved." } },
      [400, 403, 404, 409].includes(status) ? status : 503,
    );
  }
}
