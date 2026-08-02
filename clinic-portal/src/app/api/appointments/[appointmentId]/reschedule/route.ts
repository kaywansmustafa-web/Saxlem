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
    startsAt: z.string().datetime({ offset: true }),
    durationMinutes: z.number().int().min(5).max(480),
    version: z.number().int().min(1),
    operationId: z.string().uuid(),
  })
  .strict();
const appointmentIdSchema = z.string().uuid();
export async function POST(
  request: Request,
  { params }: { params: Promise<{ appointmentId: string }> },
) {
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
    const appointmentId = appointmentIdSchema.safeParse(
        (await params).appointmentId,
      ),
      json = await readClinicalJson(request),
      body = json.ok ? schema.safeParse(json.value) : null;
    if (!appointmentId.success || !body?.success)
      return invalidClinicalRequest();
    const appointment = await (
      await clinicalComposition()
    ).appointments.reschedule(appointmentId.data, {
      ...body.data,
      idempotencyKey: body.data.operationId,
    });
    return safeJson({
      ok: true,
      appointment: {
        id: appointment.id,
        version: appointment.version,
        status: appointment.status,
      },
    });
  } catch (error) {
    return safeRouteError(error);
  }
}
