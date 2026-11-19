import { z } from "zod";
import { OwnerApiError } from "@/infrastructure/api-client";
import { ownerApi, restoreOwnerSession } from "@/infrastructure/auth";
import { noStoreJson, sameOrigin } from "@/infrastructure/request-security";

/**
 * Changes to the app catalog and settings (Specialties, Home tiles, App
 * settings, a doctor's specialties). Only these operations pass through;
 * the backend validates every value again.
 */
const uuid = z.string().uuid();
const name = (max: number) => z.string().trim().min(1).max(max);
const icon = z.string().regex(/^[a-z][a-z-]{1,31}$/);
const tone = z.enum(["blue", "rose", "amber", "aqua", "lilac"]);
const status = z.enum(["active", "inactive"]);
const ids = z.array(uuid).min(1).max(500);

const specialtyCreate = z
  .object({
    nameEn: name(120),
    nameAr: z.string().trim().max(120).nullable().optional(),
    nameKu: z.string().trim().max(120).nullable().optional(),
    icon: icon.optional(),
    showOnHome: z.boolean().optional(),
  })
  .strict();
const specialtyUpdate = specialtyCreate.partial().extend({ status: status.optional() }).strict();
const concernCreate = z
  .object({
    labelEn: name(60),
    labelAr: name(60),
    labelKu: name(60),
    icon,
    tone,
    specialtyIds: z.array(uuid).min(1).max(20),
  })
  .strict();
const concernUpdate = concernCreate.partial().extend({ status: status.optional() }).strict();
const settings = z
  .object({
    changes: z.record(
      z.string().regex(/^[a-z][a-zA-Z]{1,31}\.[a-z][a-zA-Z0-9]{1,47}$/),
      z.union([z.boolean(), z.number(), z.string().max(500)]),
    ),
  })
  .strict();
const doctorSpecialties = z
  .object({
    specialtyIds: z.array(uuid).min(1).max(5),
    primarySpecialtyId: uuid,
  })
  .strict();

type Method = "POST" | "PUT" | "PATCH" | "DELETE";
type Route = { path: string; body?: z.ZodType; message: string };

/** Maps portal path + method to the backend operation. */
function route(method: Method, parts: readonly string[]): Route | null {
  const [a, b, c] = parts;
  const one = parts.length === 1,
    two = parts.length === 2,
    three = parts.length === 3;
  if (a === "specialties") {
    if (method === "POST" && one)
      return { path: "catalog/specialties", body: specialtyCreate, message: "The specialty could not be added." };
    if (method === "PUT" && two && b === "order")
      return { path: "catalog/specialties/order", body: z.object({ ids }).strict(), message: "The order could not be saved." };
    if (method === "PATCH" && two && uuid.safeParse(b).success)
      return { path: `catalog/specialties/${b}`, body: specialtyUpdate, message: "The specialty could not be saved." };
  }
  if (a === "concerns") {
    if (method === "POST" && one)
      return { path: "catalog/concerns", body: concernCreate, message: "The tile could not be added." };
    if (method === "PUT" && two && b === "order")
      return { path: "catalog/concerns/order", body: z.object({ ids }).strict(), message: "The order could not be saved." };
    if ((method === "PATCH" || method === "DELETE") && two && uuid.safeParse(b).success)
      return {
        path: `catalog/concerns/${b}`,
        body: method === "PATCH" ? concernUpdate : undefined,
        message: method === "PATCH" ? "The tile could not be saved." : "The tile could not be deleted.",
      };
  }
  if (a === "settings" && one && method === "PUT")
    return { path: "app-settings", body: settings, message: "The settings could not be saved." };
  if (a === "doctors" && three && c === "specialties" && method === "PUT" && uuid.safeParse(b).success)
    return { path: `doctors/${b}/specialties`, body: doctorSpecialties, message: "The specialties could not be saved." };
  return null;
}

const conflictMessages: Record<string, string> = {
  "catalog/specialties": "A specialty with this English name already exists.",
};

async function handle(
  method: Method,
  request: Request,
  params: Promise<{ path: string[] }>,
) {
  if (!sameOrigin(request))
    return noStoreJson({ ok: false, error: { message: "The request could not be verified." } }, 403);
  const target = route(method, (await params).path);
  if (!target)
    return noStoreJson({ ok: false, error: { message: "Not found." } }, 404);
  let body: unknown;
  if (target.body) {
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return noStoreJson({ ok: false, error: { message: "Use valid JSON." } }, 400);
    }
    const parsed = target.body.safeParse(raw);
    if (!parsed.success)
      return noStoreJson({ ok: false, error: { message: "Check the highlighted values." } }, 400);
    body = parsed.data;
  }
  const session = await restoreOwnerSession();
  if (!session)
    return noStoreJson({ ok: false, error: { message: "Sign in to continue." } }, 401);
  try {
    const result = await ownerApi().request({
      path: `/api/v1/platform/${target.path}`,
      method,
      body,
      session,
      schema: z.unknown(),
    });
    return noStoreJson({ ok: true, result: result ?? null });
  } catch (error) {
    const code = error instanceof OwnerApiError ? error.status : 503;
    const status = [400, 403, 404, 409, 429].includes(code) ? code : 503;
    const message =
      status === 409
        ? (conflictMessages[target.path] ?? target.message)
        : status === 400
          ? `${target.message} Check the values and limits.`
          : target.message;
    return noStoreJson({ ok: false, error: { message } }, status);
  }
}

type Context = { params: Promise<{ path: string[] }> };
export const POST = (request: Request, context: Context) => handle("POST", request, context.params);
export const PUT = (request: Request, context: Context) => handle("PUT", request, context.params);
export const PATCH = (request: Request, context: Context) => handle("PATCH", request, context.params);
export const DELETE = (request: Request, context: Context) => handle("DELETE", request, context.params);
