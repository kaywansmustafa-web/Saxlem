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
    query: z.string().trim().min(2).max(100),
    cursor: z.string().max(2048).optional(),
  })
  .strict();
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
    const page = await (
      await clinicalComposition()
    ).patients.search(body.data.query, body.data.cursor);
    return safeJson({ ok: true, page });
  } catch (error) {
    return safeRouteError(error);
  }
}
