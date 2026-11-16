import { z } from "zod";
import { isSameOriginMutation } from "@/infrastructure/auth/request-security";
import { clinicalComposition } from "@/infrastructure/clinical-composition";
import { safeJson, safeRouteError } from "@/app/api/auth/route-response";
import { invalidClinicalRequest } from "@/app/api/clinical-request";

const appointmentIdSchema = z.string().uuid();

/** Reception records a counter payment. Safe to repeat: the backend returns
 * the existing payment, and refuses if the patient already paid online. */
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
    if (!appointmentId.success) return invalidClinicalRequest();
    const payment = await (
      await clinicalComposition()
    ).payments.recordCounter(appointmentId.data);
    return safeJson({ ok: true, payment });
  } catch (error) {
    return safeRouteError(error);
  }
}
