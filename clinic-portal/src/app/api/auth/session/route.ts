import "server-only";

import {
  authenticationComposition,
} from "@/infrastructure/auth/composition";
import {
  clearedPortalSessionCookieOptions,
  portalSessionCookieName,
  portalSessionCookieOptions,
} from "@/infrastructure/auth/session-cookie";
import { safeJson, safeRouteError } from "../route-response";

export async function GET(request: Request): Promise<Response> {
  try {
    const { configuration, service } = authenticationComposition();
    const name = portalSessionCookieName(configuration.environment);
    const cookie = request.headers
      .get("cookie")
      ?.split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`))
      ?.slice(name.length + 1);
    try {
      const restored = await service.restore(cookie);
      if (!restored) {
        const response = safeJson({ authenticated: false }, 401);
        response.cookies.set(
          name,
          "",
          clearedPortalSessionCookieOptions(configuration.environment),
        );
        return response;
      }
      const response = safeJson(restored.session);
      if (restored.rotated) {
        response.cookies.set(
          name,
          restored.sealedSession,
          portalSessionCookieOptions(configuration.environment),
        );
      }
      return response;
    } catch (error) {
      const response = safeRouteError(error);
      response.cookies.set(
        name,
        "",
        clearedPortalSessionCookieOptions(configuration.environment),
      );
      return response;
    }
  } catch (error) {
    return safeRouteError(error);
  }
}
