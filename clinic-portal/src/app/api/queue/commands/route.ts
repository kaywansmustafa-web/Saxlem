import { z } from "zod";
import { isSameOriginMutation } from "@/infrastructure/auth/request-security";
import { clinicalComposition } from "@/infrastructure/clinical-composition";
import { safeJson, safeRouteError } from "@/app/api/auth/route-response";
import {
  invalidClinicalRequest,
  readClinicalJson,
} from "@/app/api/clinical-request";
const uuid = z.string().uuid(),
  positive = z.number().int().min(1),
  base = { operationId: uuid };
const schema = z.discriminatedUnion("operation", [
  z
    .object({
      ...base,
      operation: z.literal("open"),
      doctorId: uuid,
      version: positive,
    })
    .strict(),
  z
    .object({
      ...base,
      operation: z.literal("enqueue"),
      queueId: uuid,
      appointmentId: uuid,
      version: positive,
    })
    .strict(),
  z
    .object({
      ...base,
      operation: z.enum(["pause", "resume", "close", "call-next"]),
      queueId: uuid,
      version: positive,
      reason: z.string().trim().max(240).optional(),
    })
    .strict(),
  z
    .object({
      ...base,
      operation: z.enum(["recall", "no-response"]),
      queueId: uuid,
      entryId: uuid,
      sessionVersion: positive,
      entryVersion: positive,
    })
    .strict(),
]);
export async function POST(request: Request) {
  if (!isSameOriginMutation(request))
    return safeJson(
      {
        ok: false,
        error: {
          code: "PORTAL_ORIGIN_REJECTED",
          message: "The request could not be verified.",
        },
      },
      403,
    );
  try {
    const json = await readClinicalJson(request),
      parsed = json.ok ? schema.safeParse(json.value) : null;
    if (!parsed?.success) return invalidClinicalRequest();
    const composition = await clinicalComposition(),
      clinicId = composition.context.clinicId,
      key = `portal-queue-${parsed.data.operationId}`;
    let result;
    if (parsed.data.operation === "open")
      result = await composition.queues.open(
        clinicId,
        parsed.data.doctorId,
        parsed.data.version,
        key,
      );
    else if (parsed.data.operation === "enqueue")
      result = await composition.queues.enqueue(
        parsed.data.queueId,
        parsed.data.appointmentId,
        parsed.data.version,
        key,
      );
    else if (
      parsed.data.operation === "recall" ||
      parsed.data.operation === "no-response"
    )
      result = await composition.queues.entry(
        parsed.data.queueId,
        parsed.data.entryId,
        parsed.data.operation,
        parsed.data.sessionVersion,
        parsed.data.entryVersion,
        key,
      );
    else if ("version" in parsed.data)
      result = await composition.queues.command(
        parsed.data.queueId,
        parsed.data.operation,
        parsed.data.version,
        key,
        parsed.data.reason,
      );
    else return invalidClinicalRequest();
    return safeJson({ ok: true, result });
  } catch (error) {
    return safeRouteError(error);
  }
}
