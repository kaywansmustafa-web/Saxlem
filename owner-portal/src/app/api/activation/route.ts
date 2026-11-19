import { z } from "zod";
import { ownerApi } from "@/infrastructure/auth";
import { noStoreJson, sameOrigin } from "@/infrastructure/request-security";
import { OwnerApiError } from "@/infrastructure/api-client";

const requestSchema = z
  .object({
    activationCredential: z.string().trim().min(32).max(256),
    password: z.string().min(12).max(256),
  })
  .strict();

const responseSchema = z.object({ activated: z.literal(true) }).strict();

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
      .startsWith("application/json")
  )
    return noStoreJson(
      { ok: false, error: { message: "Use a valid form request." } },
      400,
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
  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success)
    return noStoreJson(
      { ok: false, error: { message: "Check the entered information." } },
      400,
    );

  try {
    await ownerApi().request({
      path: "/api/v1/auth/staff-activation",
      method: "POST",
      body: parsed.data,
      schema: responseSchema,
    });
    return noStoreJson({ ok: true });
  } catch (error) {
    const status =
      error instanceof OwnerApiError && [400, 409, 429].includes(error.status)
        ? error.status
        : 503;
    return noStoreJson(
      {
        ok: false,
        error: {
          message:
            status === 429
              ? "Too many activation attempts. Wait before trying again."
              : "Activation could not be completed. Check the credential or request a new one.",
        },
      },
      status,
    );
  }
}
