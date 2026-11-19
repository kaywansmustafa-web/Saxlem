import { z } from "zod";
import { safeJson, safeRouteError } from "@/app/api/auth/route-response";
import { invalidClinicalRequest, readClinicalJson } from "@/app/api/clinical-request";
import { isSameOriginMutation } from "@/infrastructure/auth/request-security";
import { doctorComposition } from "@/infrastructure/doctor-composition";

const uuid = z.string().uuid(),
  positive = z.number().int().min(1);
const schema = z.discriminatedUnion("operation", [
  z.object({ operationId: uuid, operation: z.literal("open") }).strict(),
  z
    .object({
      operationId: uuid,
      operation: z.enum(["pause", "resume", "call-next"]),
      queueId: uuid,
      version: positive,
    })
    .strict(),
  z
    .object({
      operationId: uuid,
      operation: z.enum(["start-consultation", "complete-consultation"]),
      queueId: uuid,
      entryId: uuid,
      sessionVersion: positive,
      entryVersion: positive,
    })
    .strict(),
]);

/** Queue commands a doctor gives from their own desk; the backend checks it is their queue. */
export async function POST(request: Request) {
  if (!isSameOriginMutation(request))
    return safeJson({ ok: false, error: { code: "PORTAL_ORIGIN_REJECTED", message: "The request could not be verified." } }, 403);
  try {
    const json = await readClinicalJson(request),
      parsed = json.ok ? schema.safeParse(json.value) : null;
    if (!parsed?.success) return invalidClinicalRequest();
    const desk = await doctorComposition(),
      command = parsed.data,
      key = `doctor-queue-${command.operationId}`;
    let result;
    if (command.operation === "open") {
      const me = await desk.me();
      result = await desk.queues.open(desk.context.clinicId, me.id, 1, key);
    } else if (command.operation === "start-consultation" || command.operation === "complete-consultation")
      result = await desk.queues.entry(command.queueId, command.entryId, command.operation, command.sessionVersion, command.entryVersion, key);
    else if ("version" in command)
      result = await desk.queues.command(command.queueId, command.operation, command.version, key);
    else return invalidClinicalRequest();
    return safeJson({ ok: true, result });
  } catch (error) {
    return safeRouteError(error);
  }
}
