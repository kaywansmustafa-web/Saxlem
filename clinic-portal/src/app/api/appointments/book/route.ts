import { z } from "zod";
import { isSameOriginMutation } from "@/infrastructure/auth/request-security";
import { clinicalComposition } from "@/infrastructure/clinical-composition";
import { safeJson, safeRouteError } from "@/app/api/auth/route-response";
import {
  invalidClinicalRequest,
  readClinicalJson,
} from "@/app/api/clinical-request";

const schema = z
  .object({
    doctorId: z.string().uuid(),
    patientProfileId: z.string().uuid(),
    type: z.enum(["initial", "followUp"]),
    reason: z.string().trim().min(1).max(500),
    startsAt: z.string().datetime({ offset: true }),
    durationMinutes: z.number().int().min(5).max(480),
    walkIn: z.boolean(),
    operationId: z.string().uuid(),
  })
  .strict();

/** Books a phone call or a walk-in into the same calendar the app uses.
 * A walk-in is also marked as arrived, so it joins the queue straight away. */
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
    const json = await readClinicalJson(request);
    if (!json.ok) return invalidClinicalRequest();
    const body = schema.safeParse(json.value);
    if (!body.success) return invalidClinicalRequest();
    const composition = await clinicalComposition();
    const { operationId, ...input } = body.data;
    const appointment = await composition.appointments.create({
      ...input,
      organizationId: composition.context.organizationId,
      clinicId: composition.context.clinicId,
      idempotencyKey: `portal-book-${operationId}`,
    });
    let arrived = false;
    if (input.walkIn) {
      // The booking already stands; a failed arrival can be recorded from
      // the appointment page, so it does not fail the request.
      arrived = await composition.arrivals
        .record(
          appointment.id,
          appointment.version,
          `portal-arrival-${operationId}`,
        )
        .then(() => true)
        .catch(() => false);
    }
    return safeJson({ ok: true, appointment, arrived });
  } catch (error) {
    return safeRouteError(error);
  }
}
