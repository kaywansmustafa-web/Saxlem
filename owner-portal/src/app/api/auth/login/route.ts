import { z } from "zod";
import { authenticateOwner } from "@/infrastructure/auth";
import { noStoreJson, sameOrigin } from "@/infrastructure/request-security";

const schema = z
  .object({
    email: z.string().trim().email().max(254),
    password: z.string().min(12).max(256),
  })
  .strict();
export async function POST(request: Request): Promise<Response> {
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
      { ok: false, error: { message: "Check the information you entered." } },
      400,
    );
  try {
    const body = schema.safeParse(await request.json());
    if (!body.success)
      return noStoreJson(
        { ok: false, error: { message: "Check the information you entered." } },
        400,
      );
    const returnPath = await authenticateOwner(
      body.data.email,
      body.data.password,
      request.headers.get("user-agent") ?? "unknown",
    );
    return noStoreJson({ ok: true, returnPath });
  } catch {
    return noStoreJson(
      {
        ok: false,
        error: {
          message:
            "Sign-in was unsuccessful. Check your details and try again.",
        },
      },
      401,
    );
  }
}
