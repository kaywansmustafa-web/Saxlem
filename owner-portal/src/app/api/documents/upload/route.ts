import { documentSchema } from "@/data/owner-data";
import { OwnerApiError } from "@/infrastructure/api-client";
import { ownerApi, restoreOwnerSession } from "@/infrastructure/auth";
import { noStoreJson, sameOrigin } from "@/infrastructure/request-security";

const allowedTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "text/plain",
]);
const allowedCategories = new Set(["platform", "legal", "report"]);
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return noStoreJson(
      { ok: false, error: { message: "The request could not be verified." } },
      403,
    );
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("multipart/form-data")
  )
    return noStoreJson(
      { ok: false, error: { message: "Choose a valid document file." } },
      400,
    );
  const session = await restoreOwnerSession();
  if (!session)
    return noStoreJson(
      { ok: false, error: { message: "Sign in to continue." } },
      401,
    );
  let incoming: FormData;
  try {
    incoming = await request.formData();
  } catch {
    return noStoreJson(
      { ok: false, error: { message: "The upload could not be read." } },
      400,
    );
  }
  const file = incoming.get("file"),
    category = incoming.get("category");
  if (
    !(file instanceof File) ||
    typeof category !== "string" ||
    !allowedCategories.has(category) ||
    !allowedTypes.has(file.type) ||
    file.size <= 0 ||
    file.size > 26_214_400
  )
    return noStoreJson(
      {
        ok: false,
        error: { message: "Use a PDF, JPEG, PNG, or text file up to 25 MB." },
      },
      400,
    );
  const form = new FormData();
  form.set("file", file, file.name);
  form.set("entityType", "platform");
  form.set("entityId", session.userId);
  form.set("category", category);
  form.set("filename", file.name);
  form.set("contentType", file.type);
  form.set("sizeBytes", String(file.size));
  try {
    const data = await ownerApi().upload(
      "/api/v1/platform/documents/upload",
      form,
      session,
      documentSchema,
    );
    return noStoreJson({ ok: true, data }, 201);
  } catch (error) {
    const status =
      error instanceof OwnerApiError &&
      [400, 403, 413, 422, 429].includes(error.status)
        ? error.status
        : 503;
    return noStoreJson(
      {
        ok: false,
        error: { message: "The document could not be uploaded safely." },
      },
      status,
    );
  }
}
