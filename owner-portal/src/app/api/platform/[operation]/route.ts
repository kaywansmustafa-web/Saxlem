import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  createStaffResponseSchema,
  documentSchema,
  statementSchema,
} from "@/data/owner-data";
import { OwnerApiError } from "@/infrastructure/api-client";
import { ownerApi, restoreOwnerSession } from "@/infrastructure/auth";
import { noStoreJson, sameOrigin } from "@/infrastructure/request-security";

const staff = z
  .object({
    email: z.string().email().max(254),
    role: z.enum(["receptionist", "clinicManager"]),
    organizationId: z.string().uuid(),
    clinicId: z.string().uuid(),
    doctorIds: z.array(z.string().uuid()).max(20).optional(),
  })
  .strict();
const doctor = z
  .object({
    email: z.string().email(),
    organizationId: z.string().uuid(),
    clinicId: z.string().uuid(),
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    displayName: z.string().trim().min(1).max(120),
    gender: z.enum(["female", "male", "unspecified"]),
    licenseNumber: z.string().trim().min(2).max(80),
    yearsOfExperience: z.coerce.number().int().min(0).max(80),
    specialtyId: z.string().uuid(),
    languages: z.array(z.string().trim().min(2).max(40)).max(12),
    biography: z.string().trim().max(4000).optional(),
  })
  .strict();
const document = z
  .object({
    entityType: z.string().regex(/^[a-z][a-zA-Z]{1,39}$/),
    entityId: z.string().uuid(),
    organizationId: z.string().uuid().optional(),
    clinicId: z.string().uuid().optional(),
    category: z.enum([
      "organization",
      "clinic",
      "doctor",
      "license",
      "billing",
      "statement",
      "legal",
      "report",
      "platform",
    ]),
    filename: z
      .string()
      .min(1)
      .max(255)
      .regex(/^[^\\/\u0000-\u001f]+$/u),
    contentType: z.enum([
      "application/pdf",
      "image/jpeg",
      "image/png",
      "text/plain",
    ]),
    sizeBytes: z.number().int().min(0).max(26214400),
    expiresAt: z.string().datetime({ offset: true }).optional(),
  })
  .strict();
const finalize = z
  .object({
    statementId: z.string().uuid(),
    version: z.number().int().positive(),
  })
  .strict();
const responseSchemas = {
  staff,
  doctor: z
    .object({
      id: z.string().uuid(),
      status: z.string(),
      email: z.string().email(),
      activationRequired: z.boolean(),
      activationCredential: z.string(),
      activationExpiresAt: z.string().datetime({ offset: true }),
      version: z.number().int(),
    })
    .strict(),
  document: documentSchema,
  finalize: statementSchema,
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ operation: string }> },
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
  const { operation } = await params;
  if (!Object.hasOwn(responseSchemas, operation))
    return noStoreJson(
      { ok: false, error: { message: "This operation is unavailable." } },
      404,
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
  const parser =
    operation === "staff"
      ? staff
      : operation === "doctor"
        ? doctor
        : operation === "document"
          ? document
          : finalize;
  const parsed = parser.safeParse(raw);
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
  const body = parsed.data as Record<string, unknown>;
  const path =
    operation === "staff"
      ? "/api/v1/platform/staff"
      : operation === "doctor"
        ? "/api/v1/platform/doctors"
        : operation === "document"
          ? "/api/v1/platform/documents"
          : `/api/v1/billing/statements/${String(body.statementId)}/finalize`;
  try {
    const common = {
      path: path as `/api/v1/${string}`,
      method: "POST" as const,
      body: operation === "finalize" ? { version: body.version } : body,
      session,
      idempotencyKey: randomUUID(),
    };
    const data =
      operation === "staff"
        ? await ownerApi().request({
            ...common,
            schema: createStaffResponseSchema,
          })
        : operation === "doctor"
          ? await ownerApi().request({
              ...common,
              schema: responseSchemas.doctor,
            })
          : operation === "document"
            ? await ownerApi().request({ ...common, schema: documentSchema })
            : await ownerApi().request({ ...common, schema: statementSchema });
    return noStoreJson(
      { ok: true, data },
      operation === "finalize" ? 200 : 201,
    );
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
              ? "The record changed or was already finalized. Refresh and try again."
              : "The operation could not be completed safely.",
        },
      },
      status,
    );
  }
}
