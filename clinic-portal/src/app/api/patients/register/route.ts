import { z } from "zod";
import { isSameOriginMutation } from "@/infrastructure/auth/request-security";
import { clinicalComposition } from "@/infrastructure/clinical-composition";
import { safeJson, safeRouteError } from "@/app/api/auth/route-response";
import {
  invalidClinicalRequest,
  readClinicalJson,
} from "@/app/api/clinical-request";

const name = z.string().trim().min(1).max(80);
const schema = z
  .object({
    firstName: name,
    lastName: name,
    phoneNumber: z.string().trim().min(7).max(20),
    gender: z.enum(["female", "male", "unspecified"]).optional(),
  })
  .strict();

/** Reception registers someone who phoned or walked in without the app. */
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
    const patient = await (
      await clinicalComposition()
    ).patients.register(body.data);
    return safeJson({ ok: true, patient });
  } catch (error) {
    return safeRouteError(error);
  }
}
