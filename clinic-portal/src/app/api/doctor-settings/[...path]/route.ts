import { z } from "zod";
import { isSameOriginMutation } from "@/infrastructure/auth/request-security";
import { clinicalComposition } from "@/infrastructure/clinical-composition";
import { safeJson, safeRouteError } from "@/app/api/auth/route-response";
import { invalidClinicalRequest, readClinicalJson } from "@/app/api/clinical-request";
import { BIOGRAPHY_MAX, DOCTOR_LANGUAGES, FEE_MAX, PERIODS_MAX } from "@/features/doctor-settings/domain/week";

const id = z.string().uuid();
const period = z
  .object({
    weekday: z.number().int().min(0).max(6),
    startsMinute: z.number().int().min(0).max(1440),
    endsMinute: z.number().int().min(0).max(1440),
  })
  .strict();
const periods = z.array(period).max(PERIODS_MAX);
const fee = z.number().int().min(0).max(FEE_MAX).nullable();
const schemas = {
  hours: z.object({ weekly: periods, breaks: periods }).strict(),
  leave: z.object({ startsAt: z.string().datetime({ offset: true }), endsAt: z.string().datetime({ offset: true }) }).strict(),
  booking: z
    .object({
      visitMinutes: z.number().int().min(5).max(240).multipleOf(5).nullable(),
      bookable: z.boolean(),
      acceptingNewPatients: z.boolean(),
    })
    .strict(),
  details: z
    .object({
      biography: z.string().max(BIOGRAPHY_MAX).optional(),
      yearsOfExperience: z.number().int().min(0).max(80).optional(),
      languages: z.array(z.enum(DOCTOR_LANGUAGES)).min(1).max(DOCTOR_LANGUAGES.length).optional(),
      consultationFeeIqd: fee.optional(),
      followUpFeeIqd: fee.optional(),
    })
    .strict(),
  openingHours: z.object({ periods }).strict(),
};

type Params = { params: Promise<{ path: string[] }> };

const rejected = () =>
  safeJson({ ok: false, error: { code: "PORTAL_ORIGIN_REJECTED", message: "The request could not be verified." } }, 403);
const unknownRoute = () =>
  safeJson({ ok: false, error: { code: "PORTAL_NOT_FOUND", message: "The requested information could not be found." } }, 404);

async function body<T>(request: Request, schema: z.ZodType<T>): Promise<T | null> {
  const json = await readClinicalJson(request);
  if (!json.ok) return null;
  const parsed = schema.safeParse(json.value);
  return parsed.success ? parsed.data : null;
}

/** Reception changes their doctors' hours, time off, booking, fees and profile. */
export async function PUT(request: Request, { params }: Params) {
  if (!isSameOriginMutation(request)) return rejected();
  try {
    const path = (await params).path;
    const settings = (await clinicalComposition()).doctorSettings;
    if (path.length === 1 && path[0] === "opening-hours") {
      const input = await body(request, schemas.openingHours);
      if (!input) return invalidClinicalRequest();
      await settings.setOpeningHours(input.periods);
      return safeJson({ ok: true });
    }
    const [doctorId, action] = path;
    if (path.length !== 2 || !id.safeParse(doctorId).success) return unknownRoute();
    if (action === "hours") {
      const input = await body(request, schemas.hours);
      if (!input) return invalidClinicalRequest();
      await settings.setWeek(doctorId!, input);
    } else if (action === "booking") {
      const input = await body(request, schemas.booking);
      if (!input) return invalidClinicalRequest();
      await settings.setBooking(doctorId!, input);
    } else if (action === "details") {
      const input = await body(request, schemas.details);
      if (!input) return invalidClinicalRequest();
      await settings.setDetails(doctorId!, input);
    } else return unknownRoute();
    return safeJson({ ok: true });
  } catch (error) {
    return safeRouteError(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  if (!isSameOriginMutation(request)) return rejected();
  try {
    const path = (await params).path;
    if (path.length !== 2 || path[1] !== "leave" || !id.safeParse(path[0]).success) return unknownRoute();
    const input = await body(request, schemas.leave);
    if (!input) return invalidClinicalRequest();
    const result = await (await clinicalComposition()).doctorSettings.addLeave(path[0]!, input);
    return safeJson({ ok: true, bookedVisits: result.bookedVisits });
  } catch (error) {
    return safeRouteError(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  if (!isSameOriginMutation(request)) return rejected();
  try {
    const path = (await params).path;
    if (path.length !== 3 || path[1] !== "leave" || !id.safeParse(path[0]).success || !id.safeParse(path[2]).success)
      return unknownRoute();
    await (await clinicalComposition()).doctorSettings.removeLeave(path[0]!, path[2]!);
    return safeJson({ ok: true });
  } catch (error) {
    return safeRouteError(error);
  }
}
