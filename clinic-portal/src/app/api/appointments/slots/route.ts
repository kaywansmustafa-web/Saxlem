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
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .strict();

/** Free slots for one doctor on one day, scoped to the signed-in clinic. */
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
    const day = await composition.appointments.slots({
      ...body.data,
      clinicId: composition.context.clinicId,
    });
    return safeJson({ ok: true, day });
  } catch (error) {
    return safeRouteError(error);
  }
}
