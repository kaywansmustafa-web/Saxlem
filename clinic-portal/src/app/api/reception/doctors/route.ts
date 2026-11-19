import { z } from "zod";
import { isSameOriginMutation } from "@/infrastructure/auth/request-security";
import { clinicalComposition } from "@/infrastructure/clinical-composition";
import { safeJson, safeRouteError } from "@/app/api/auth/route-response";
import {
  invalidClinicalRequest,
  readClinicalJson,
} from "@/app/api/clinical-request";

const schema = z
  .object({ doctorIds: z.array(z.string().uuid()).min(1).max(20) })
  .strict();

/** A receptionist chooses the doctor(s) they work for. */
export async function PUT(request: Request) {
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
    const doctors = await (
      await clinicalComposition()
    ).reception.update(body.data.doctorIds);
    return safeJson({ ok: true, doctors });
  } catch (error) {
    return safeRouteError(error);
  }
}
