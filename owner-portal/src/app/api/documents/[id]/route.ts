import { z } from "zod";
import { OwnerApiError } from "@/infrastructure/api-client";
import { ownerApi, restoreOwnerSession } from "@/infrastructure/auth";
import { noStoreJson, sameOrigin } from "@/infrastructure/request-security";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!sameOrigin(request))
    return noStoreJson(
      { ok: false, error: { message: "The request could not be verified." } },
      403,
    );
  const parsed = z
    .string()
    .uuid()
    .safeParse((await params).id);
  if (!parsed.success)
    return noStoreJson(
      { ok: false, error: { message: "The document is invalid." } },
      400,
    );
  const session = await restoreOwnerSession();
  if (!session)
    return noStoreJson(
      { ok: false, error: { message: "Sign in to continue." } },
      401,
    );
  try {
    await ownerApi().request({
      path: `/api/v1/platform/documents/${parsed.data}`,
      method: "DELETE",
      session,
    });
    return noStoreJson({ ok: true });
  } catch (error) {
    const status =
      error instanceof OwnerApiError &&
      [403, 404, 409, 429].includes(error.status)
        ? error.status
        : 503;
    return noStoreJson(
      {
        ok: false,
        error: { message: "The document could not be deleted safely." },
      },
      status,
    );
  }
}
