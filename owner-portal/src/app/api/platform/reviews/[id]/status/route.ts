import { z } from "zod";
import { OwnerApiError } from "@/infrastructure/api-client";
import { ownerApi, restoreOwnerSession } from "@/infrastructure/auth";
import { noStoreJson, sameOrigin } from "@/infrastructure/request-security";

const body = z.object({ status: z.enum(["published", "hidden"]) }).strict();

/** Hides a review or shows it again. */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!sameOrigin(request))
    return noStoreJson(
      { ok: false, error: { message: "The request could not be verified." } },
      403,
    );
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success)
    return noStoreJson(
      { ok: false, error: { message: "Review not found." } },
      404,
    );
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return noStoreJson({ ok: false, error: { message: "Use valid JSON." } }, 400);
  }
  const parsed = body.safeParse(raw);
  if (!parsed.success)
    return noStoreJson({ ok: false, error: { message: "Choose a status." } }, 400);
  const session = await restoreOwnerSession();
  if (!session)
    return noStoreJson({ ok: false, error: { message: "Sign in to continue." } }, 401);
  try {
    await ownerApi().request({
      path: `/api/v1/platform/reviews/${id}/status`,
      method: "PUT",
      body: parsed.data,
      session,
      schema: z.unknown(),
    });
    return noStoreJson({ ok: true });
  } catch (error) {
    const status =
      error instanceof OwnerApiError && [403, 404, 429].includes(error.status)
        ? error.status
        : 503;
    return noStoreJson(
      { ok: false, error: { message: "The review could not be changed." } },
      status,
    );
  }
}
