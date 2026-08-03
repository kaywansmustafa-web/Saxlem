import { z } from "zod";
import { isSameOriginMutation } from "@/infrastructure/auth/request-security";
import { clinicalComposition } from "@/infrastructure/clinical-composition";
import { safeJson, safeRouteError } from "@/app/api/auth/route-response";
import {
  invalidClinicalRequest,
  readClinicalJson,
} from "@/app/api/clinical-request";

const appointmentIdSchema = z.string().uuid();
const bodySchema = z
  .object({ version: z.number().int().min(1), operationId: z.string().uuid() })
  .strict();

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
    );
    const json = await readClinicalJson(request);
    const body = json.ok ? bodySchema.safeParse(json.value) : null;
    if (!appointmentId.success || !body?.success)
      return invalidClinicalRequest();
    const arrival = await (
      await clinicalComposition()
    ).arrivals.record(
      appointmentId.data,
      body.data.version,
      `portal-arrival-${body.data.operationId}`,
    );
    return safeJson({ ok: true, arrival });
  } catch (error) {
    return safeRouteError(error);
  }
}
