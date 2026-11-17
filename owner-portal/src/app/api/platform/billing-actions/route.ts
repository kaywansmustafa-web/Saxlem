import { randomUUID } from "node:crypto";
import { z } from "zod";
import { OwnerApiError } from "@/infrastructure/api-client";
import { ownerApi, restoreOwnerSession } from "@/infrastructure/auth";
import { noStoreJson, sameOrigin } from "@/infrastructure/request-security";

const uuid = z.string().uuid();
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** Every billing action the Owner Portal can take, and how it maps to the
 * backend. The backend re-checks everything; this keeps junk out. */
const actions = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("createPlan"),
      displayName: z.string().trim().min(1).max(80),
      commissionAmountIqd: z.number().int().min(0).max(1_000_000),
    })
    .strict(),
  z
    .object({
      action: z.literal("planStatus"),
      planId: uuid,
      status: z.enum(["active", "inactive"]),
    })
    .strict(),
  z
    .object({
      action: z.literal("cycleStart"),
      organizationId: uuid,
      startDate: day,
    })
    .strict(),
  z
    .object({
      action: z.literal("organizationPlan"),
      organizationId: uuid,
      planId: uuid,
      from: day,
    })
    .strict(),
  z
    .object({
      action: z.literal("doctorPlan"),
      organizationId: uuid,
      doctorId: uuid,
      planId: uuid.nullable(),
      from: day,
    })
    .strict(),
  z
    .object({
      action: z.literal("credit"),
      commissionId: uuid,
      reason: z.string().trim().min(1).max(500),
    })
    .strict(),
  z
    .object({
      action: z.literal("settle"),
      organizationId: uuid,
      doctorId: uuid,
      cycleNumber: z.number().int().positive(),
      method: z.enum(["fib", "cash"]),
      expectedNetPayableIqd: z.number().int(),
      reference: z.string().trim().max(120).optional(),
      counterpartyName: z.string().trim().max(120).optional(),
      note: z.string().trim().max(500).optional(),
    })
    .strict(),
]);
type Action = z.infer<typeof actions>;

function route(input: Action): {
  path: `/api/v1/${string}`;
  method: "POST" | "PUT";
  body: unknown;
} {
  switch (input.action) {
    case "createPlan":
      return {
        path: "/api/v1/billing/plans",
        method: "POST",
        body: {
          displayName: input.displayName,
          commissionAmountIqd: input.commissionAmountIqd,
        },
      };
    case "planStatus":
      return {
        path: `/api/v1/billing/plans/${input.planId}/status`,
        method: "PUT",
        body: { status: input.status },
      };
    case "cycleStart":
      return {
        path: `/api/v1/billing/organizations/${input.organizationId}/cycle-start`,
        method: "PUT",
        body: { startDate: input.startDate },
      };
    case "organizationPlan":
      return {
        path: `/api/v1/billing/organizations/${input.organizationId}/plan-changes`,
        method: "POST",
        body: { planId: input.planId, from: input.from },
      };
    case "doctorPlan":
      return {
        path: `/api/v1/billing/organizations/${input.organizationId}/doctors/${input.doctorId}/plan`,
        method: "POST",
        body: { planId: input.planId, from: input.from },
      };
    case "credit":
      return {
        path: `/api/v1/billing/commissions/${input.commissionId}/credit`,
        method: "POST",
        body: { reason: input.reason },
      };
    case "settle": {
      const { organizationId, doctorId, cycleNumber, ...body } = input;
      delete (body as { action?: string }).action;
      return {
        path: `/api/v1/platform/organizations/${organizationId}/doctors/${doctorId}/statements/${cycleNumber}/settlement`,
        method: "POST",
        body,
      };
    }
  }
}

export async function POST(request: Request) {
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
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return noStoreJson(
      { ok: false, error: { message: "Use valid JSON." } },
      400,
    );
  }
  const parsed = actions.safeParse(raw);
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
  const target = route(parsed.data);
  try {
    await ownerApi().request({
      ...target,
      session,
      idempotencyKey: randomUUID(),
    });
    return noStoreJson({ ok: true });
  } catch (error) {
    const status =
      error instanceof OwnerApiError &&
      [400, 403, 404, 409].includes(error.status)
        ? error.status
        : 503;
    // Business rules (e.g. "Settle statement … first") are worth showing.
    const detail =
      error instanceof OwnerApiError &&
      (status === 400 || status === 409) &&
      error.detail
        ? error.detail
        : null;
    return noStoreJson(
      {
        ok: false,
        error: {
          message:
            detail ??
            (status === 404
              ? "That record was not found. Refresh and try again."
              : "This could not be saved. Try again."),
        },
      },
      status,
    );
  }
}
