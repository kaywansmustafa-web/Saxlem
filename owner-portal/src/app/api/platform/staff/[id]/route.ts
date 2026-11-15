import { randomUUID } from "node:crypto";
import { z } from "zod";
import { staffSchema } from "@/data/owner-data";
import { OwnerApiError } from "@/infrastructure/api-client";
import { ownerApi, restoreOwnerSession } from "@/infrastructure/auth";
import { noStoreJson, sameOrigin } from "@/infrastructure/request-security";

const idSchema = z.string().uuid();
const mutationSchema = z.discriminatedUnion("operation", [
  z
    .object({
      operation: z.literal("status"),
      status: z.enum(["active", "inactive"]),
    })
    .strict(),
  z
    .object({
      operation: z.literal("addMembership"),
      organizationId: idSchema,
      clinicId: idSchema,
      role: z.enum(["receptionist", "clinicManager", "doctor"]),
    })
    .strict(),
  z
    .object({
      operation: z.literal("removeMembership"),
      membershipId: idSchema,
    })
    .strict(),
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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
  const parsedId = idSchema.safeParse((await params).id);
  if (!parsedId.success)
    return noStoreJson(
      { ok: false, error: { message: "The staff account is invalid." } },
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
  const parsed = mutationSchema.safeParse(raw);
  if (!parsed.success)
    return noStoreJson(
      { ok: false, error: { message: "Check the requested staff change." } },
      400,
    );
  const session = await restoreOwnerSession();
  if (!session)
    return noStoreJson(
      { ok: false, error: { message: "Sign in to continue." } },
      401,
    );
  const operation = parsed.data;
  const path =
    operation.operation === "status"
      ? `/api/v1/platform/staff/${parsedId.data}/status`
      : operation.operation === "addMembership"
        ? `/api/v1/platform/staff/${parsedId.data}/memberships`
        : `/api/v1/platform/staff/${parsedId.data}/memberships/${operation.membershipId}`;
  const method =
    operation.operation === "removeMembership"
      ? "DELETE"
      : operation.operation === "addMembership"
        ? "POST"
        : "PATCH";
  const body =
    operation.operation === "status"
      ? { status: operation.status }
      : operation.operation === "addMembership"
        ? {
            organizationId: operation.organizationId,
            clinicId: operation.clinicId,
            role: operation.role,
          }
        : undefined;
  try {
    const data = await ownerApi().request({
      path: path as `/api/v1/${string}`,
      method,
      body,
      session,
      idempotencyKey: randomUUID(),
      schema: staffSchema,
    });
    return noStoreJson({ ok: true, data });
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
              ? "This account changed. Refresh before trying again."
              : "The staff change could not be completed safely.",
        },
      },
      status,
    );
  }
}
