import { z } from "zod";
import { paymentAccountSchema } from "@/data/owner-data";
import { OwnerApiError } from "@/infrastructure/api-client";
import { ownerApi, restoreOwnerSession } from "@/infrastructure/auth";
import { noStoreJson, sameOrigin } from "@/infrastructure/request-security";

const body = z
  .object({
    provider: z.enum(["fib", "simulated"]),
    environment: z.enum(["stage", "prod", "simulated"]),
    clientId: z.string().trim().min(1).max(200),
    clientSecret: z.string().min(8).max(500),
    onlineEnabled: z.boolean(),
  })
  .strict();

/** Connects a clinic organization's own FIB merchant account. The secret is
 * sent straight to the backend, which checks it with FIB and stores it
 * encrypted; it is never returned or logged here. */
export async function PUT(
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
      path: `/api/v1/platform/organizations/${organizationId}/payment-account`,
      method: "PUT",
      session,
      body: parsed.data,
      schema: paymentAccountSchema,
    });
    return noStoreJson({ ok: true, data });
  } catch (error) {
    const status = error instanceof OwnerApiError ? error.status : 503;
    return noStoreJson(
      {
        ok: false,
        error: {
          message:
            status === 400
              ? "FIB did not accept these credentials. Check the client ID and secret."
              : status === 503
                ? "FIB or Saxlem is not responding. Try again in a minute."
                : "The account could not be saved.",
        },
      },
      [400, 403, 404, 409].includes(status) ? status : 503,
    );
  }
}
