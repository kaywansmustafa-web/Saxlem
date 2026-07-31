// @vitest-environment node

import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { GET as restore } from "@/app/api/auth/session/route";
import {
  PortalSessionCookie,
  portalSessionCookieName,
} from "@/infrastructure/auth/session-cookie";
import {
  resetPortalConfigurationForTests,
} from "@/infrastructure/config/environment";
import { configuration, session, tokenResponse } from "./fixtures";

const environment = {
  SAXLEM_PORTAL_ENV: "development",
  SAXLEM_BACKEND_API_URL: "http://backend.test",
  SAXLEM_PORTAL_SESSION_SECRET:
    "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY",
  SAXLEM_PORTAL_REQUEST_TIMEOUT_MS: "1000",
};
const routeConfiguration = configuration({
  sessionSecret: environment.SAXLEM_PORTAL_SESSION_SECRET,
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  resetPortalConfigurationForTests();
});

describe("same-origin authentication routes", () => {
  it("rejects cross-origin mutations", async () => {
    const response = await logout(
      new Request("https://portal.test/api/auth/logout", {
        method: "POST",
        headers: { origin: "https://evil.test" },
      }),
    );
    expect(response.status).toBe(403);
  });

  it("sanitizes malformed login JSON as a client error", async () => {
    const response = await login(
      new Request("https://portal.test/api/auth/login", {
        method: "POST",
        headers: {
          origin: "https://portal.test",
          "sec-fetch-site": "same-origin",
          "content-type": "application/json",
        },
        body: "{",
      }),
    );
    expect(response.status).toBe(400);
    expect(await response.text()).not.toContain("SyntaxError");
  });

  it("returns a sanitized login response with no browser token exposure", async () => {
    for (const [key, value] of Object.entries(environment)) {
      vi.stubEnv(key, value);
    }
    const tokens = await tokenResponse();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json(tokens, { status: 200 })),
    );
    const response = await login(
      new Request("https://portal.test/api/auth/login", {
        method: "POST",
        headers: {
          origin: "https://portal.test",
          "sec-fetch-site": "same-origin",
          "content-type": "application/json",
          "user-agent": "Test Browser",
        },
        body: JSON.stringify({
          email: "staff@saxlem.test",
          password: "correct-password",
          returnPath: "https://evil.test",
        }),
      }),
    );
    const body = await response.text();
    expect(response.status).toBe(200);
    expect(body).toBe(
      JSON.stringify({ ok: true, returnPath: "/en/dashboard" }),
    );
    expect(body).not.toContain(tokens.accessToken);
    expect(body).not.toContain(tokens.refreshToken);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });

  it("clears the local cookie when backend logout is unavailable", async () => {
    for (const [key, value] of Object.entries(environment)) {
      vi.stubEnv(key, value);
    }
    const manager = new PortalSessionCookie(routeConfiguration);
    const sealed = await manager.seal(await session());
    const backend = vi.fn().mockRejectedValue(new Error("offline"));
    vi.stubGlobal("fetch", backend);
    const response = await logout(
      new Request("https://portal.test/api/auth/logout", {
        method: "POST",
        headers: {
          origin: "https://portal.test",
          "sec-fetch-site": "same-origin",
          cookie: `saxlem_portal_session=${sealed}`,
        },
      }),
    );
    expect(response.status).toBe(200);
    expect(backend).toHaveBeenCalledOnce();
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("clears the cookie when refresh rotation fails", async () => {
    for (const [key, value] of Object.entries(environment)) {
      vi.stubEnv(key, value);
    }
    const manager = new PortalSessionCookie(routeConfiguration);
    const sealed = await manager.seal(
      await session({ accessExpiresAt: Date.now() - 1_000 }),
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json(
          {
            error: {
              code: "SESSION_EXPIRED",
              message: "backend detail",
              requestId: "refresh-request",
              retryable: false,
              fieldErrors: [],
            },
          },
          { status: 401 },
        ),
      ),
    );
    const response = await restore(
      new Request("https://portal.test/api/auth/session", {
        headers: {
          cookie: `${portalSessionCookieName("development")}=${sealed}`,
        },
      }),
    );
    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(await response.text()).not.toContain("backend detail");
  });
});
