import { z } from "zod";
import { clinicSchema } from "@/data/owner-data";
import { OwnerApiError } from "@/infrastructure/api-client";
import { ownerApi, restoreOwnerSession } from "@/infrastructure/auth";
import { noStoreJson, sameOrigin } from "@/infrastructure/request-security";

const text = (max: number) => z.string().trim().max(max).nullable();
const body = z
  .object({
    address: text(300),
    area: text(120),
    city: text(80),
    latitude: z.number().min(-90).max(90).nullable(),
    longitude: z.number().min(-180).max(180).nullable(),
    phoneNumber: z
      .string()
      .trim()
      .regex(/^\+?[0-9 ()-]{7,24}$/)
      .nullable(),
  })
  .strict()
  .refine((value) => (value.latitude === null) === (value.longitude === null));

/** Saves a clinic's address, map pin and public phone number. */
export async function PUT(
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
      { ok: false, error: { message: "Clinic not found." } },
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
      { ok: false, error: { message: "Check the address, map link and phone number." } },
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
        path: `/api/v1/administration/clinics/${id}/location`,
        method: "PUT",
        body: parsed.data,
        session,
        schema: clinicSchema,
      }),
    });
  } catch (error) {
    const status =
      error instanceof OwnerApiError &&
      [400, 403, 404, 422, 429].includes(error.status)
        ? error.status
        : 503;
    return noStoreJson(
      {
        ok: false,
        error: {
          message:
            status === 400
              ? "Check the address, map link and phone number."
              : "The clinic could not be updated safely.",
        },
      },
      status,
    );
  }
}
