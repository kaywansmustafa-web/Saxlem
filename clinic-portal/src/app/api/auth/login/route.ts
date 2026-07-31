import "server-only";

import { z } from "zod";
import { isSameOriginMutation } from "@/infrastructure/auth/request-security";
import {
  portalSessionCookieName,
  portalSessionCookieOptions,
  safeReturnPath,
} from "@/infrastructure/auth/session-cookie";
import { authenticationComposition } from "@/infrastructure/auth/composition";
import { safeJson, safeRouteError } from "../route-response";
import { safeRoleReturnPath } from "@/features/portal-foundation/domain/route-policy";

const requestSchema = z
  .object({
    email: z.string().trim().email().max(254),
    password: z.string().min(12).max(256),
    returnPath: z.string().max(512).optional(),
  })
  .strict();

export async function POST(request: Request): Promise<Response> {
  if (!isSameOriginMutation(request)) {
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
  }

  try {
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return safeJson(
        {
          ok: false,
          error: {
            code: "PORTAL_INVALID_LOGIN",
            message: "Check the information you entered and try again.",
          },
        },
        400,
      );
    }
    const body = requestSchema.safeParse(raw);
    if (!body.success) {
      return safeJson(
        {
          ok: false,
          error: {
            code: "PORTAL_INVALID_LOGIN",
            message: "Check the information you entered and try again.",
          },
        },
        400,
      );
    }
    const { configuration, service } = authenticationComposition();
    const result = await service.authenticate({
      email: body.data.email,
      password: body.data.password,
      userAgent: request.headers.get("user-agent") ?? "unknown",
    });
    const response = safeJson({
      ok: true,
      returnPath: safeRoleReturnPath(
        safeReturnPath(body.data.returnPath),
        result.session.role,
      ),
    });
    response.cookies.set(
      portalSessionCookieName(configuration.environment),
      result.sealedSession,
      portalSessionCookieOptions(configuration.environment),
    );
    return response;
  } catch (error) {
    return safeRouteError(error);
  }
}
