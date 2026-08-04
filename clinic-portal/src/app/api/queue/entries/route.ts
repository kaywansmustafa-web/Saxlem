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
    queueId: z.string().uuid(),
    cursor: z
      .string()
      .min(1)
      .max(512)
      .regex(/^[\x21-\x7e]+$/u),
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
    const parsed = json.ok ? schema.safeParse(json.value) : null;
    if (!parsed?.success) return invalidClinicalRequest();
    const page = await (
      await clinicalComposition()
    ).queues.entries(parsed.data.queueId, parsed.data.cursor);
    return safeJson({ ok: true, page });
  } catch (error) {
    return safeRouteError(error);
  }
}
