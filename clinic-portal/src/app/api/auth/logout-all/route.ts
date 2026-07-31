import { isSameOriginMutation } from "@/infrastructure/auth/request-security";
import { authenticationComposition } from "@/infrastructure/auth/composition";
import {
  clearedPortalSessionCookieOptions,
  portalSessionCookieName,
} from "@/infrastructure/auth/session-cookie";
import { safeJson } from "../route-response";

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
    const composition = authenticationComposition();
    const name = portalSessionCookieName(composition.configuration.environment);
    const value = request.headers
      .get("cookie")
      ?.split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`))
      ?.slice(name.length + 1);
    try {
      await composition.service.logoutAll(value);
    } catch {
      // Always remove the local portal session, including on backend failure.
    }
    const response = safeJson({ ok: true });
    response.cookies.set(
      name,
      "",
      clearedPortalSessionCookieOptions(composition.configuration.environment),
    );
    return response;
  } catch {
    return safeJson(
      {
        ok: false,
        error: {
          code: "PORTAL_CONFIGURATION_UNAVAILABLE",
          message: "The request could not be completed.",
        },
      },
      503,
    );
  }
}
