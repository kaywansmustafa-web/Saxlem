// @vitest-environment node

import { createServer, type Server } from "node:http";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as login } from "@/app/api/auth/login/route";
import { GET as restore } from "@/app/api/auth/session/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { POST as logoutAll } from "@/app/api/auth/logout-all/route";
import { resetPortalConfigurationForTests } from "@/infrastructure/config/environment";
import { tokenResponse } from "../authentication/fixtures";

describe("Sprint 13K-C controlled HTTP BFF certification", () => {
  let server: Server;
  let origin = "";
  const requests: Array<{ path: string; body: string }> = [];

  beforeEach(async () => {
    server = createServer(async (request, response) => {
      let body = "";
      for await (const chunk of request) body += String(chunk);
      requests.push({ path: request.url ?? "", body });
      response.setHeader("content-type", "application/json");
      response.setHeader("x-request-id", "certification-request");
      if (request.url === "/api/v1/auth/login") {
        response.end(JSON.stringify(await tokenResponse("receptionist", Date.now() + 20_000)));
      } else if (request.url === "/api/v1/auth/refresh") {
        response.end(JSON.stringify(await tokenResponse("receptionist", Date.now() + 600_000)));
      } else {
        response.statusCode = 204;
        response.end();
      }
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("HTTP server unavailable");
    origin = `http://127.0.0.1:${address.port}`;
    vi.stubEnv("SAXLEM_PORTAL_ENV", "development");
    vi.stubEnv("SAXLEM_BACKEND_API_URL", origin);
    vi.stubEnv("SAXLEM_PORTAL_SESSION_SECRET", "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY");
    vi.stubEnv("SAXLEM_PORTAL_REQUEST_TIMEOUT_MS", "1000");
    resetPortalConfigurationForTests();
  });

  afterEach(async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    requests.length = 0;
    vi.unstubAllEnvs();
    resetPortalConfigurationForTests();
  });

  it("completes login, restoration, rotation, logout and repeated logout-all", async () => {
    const loginResponse = await login(new Request("https://portal.test/api/auth/login", {
      method: "POST",
      headers: { origin: "https://portal.test", "sec-fetch-site": "same-origin", "content-type": "application/json", "user-agent": "Certification Browser" },
      body: JSON.stringify({ email: "staff@saxlem.test", password: "correct-password", returnPath: "/en/dashboard" }),
    }));
    expect(loginResponse.status).toBe(200);
    expect(await loginResponse.clone().json()).toEqual({ ok: true, returnPath: "/en/dashboard" });
    const cookie = loginResponse.headers.get("set-cookie")!.split(";")[0];
    expect(loginResponse.headers.get("set-cookie")).toContain("HttpOnly");

    const sessionResponse = await restore(new Request("https://portal.test/api/auth/session", { headers: { cookie } }));
    expect(sessionResponse.status).toBe(200);
    expect(sessionResponse.headers.get("set-cookie")).toContain("HttpOnly");
    const rotatedCookie = sessionResponse.headers.get("set-cookie")!.split(";")[0];

    const logoutResponse = await logout(new Request("https://portal.test/api/auth/logout", {
      method: "POST",
      headers: { origin: "https://portal.test", "sec-fetch-site": "same-origin", cookie: rotatedCookie },
    }));
    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.headers.get("set-cookie")).toContain("Max-Age=0");

    for (let index = 0; index < 2; index += 1) {
      const response = await logoutAll(new Request("https://portal.test/api/auth/logout-all", {
        method: "POST",
        headers: { origin: "https://portal.test", "sec-fetch-site": "same-origin" },
      }));
      expect(response.status).toBe(200);
    }
    expect(requests.map((item) => item.path)).toEqual([
      "/api/v1/auth/login", "/api/v1/auth/refresh", "/api/v1/auth/logout",
    ]);
    expect(requests.every((item) => !item.body.includes("accessToken"))).toBe(true);
  });

  it("sends credentials only once to the configured backend origin", async () => {
    await login(new Request("https://portal.test/api/auth/login", {
      method: "POST",
      headers: { origin: "https://portal.test", "sec-fetch-site": "same-origin", "content-type": "application/json" },
      body: JSON.stringify({ email: "staff@saxlem.test", password: "correct-password" }),
    }));
    expect(requests).toHaveLength(1);
    expect(new URL(origin).origin).toBe(origin);
    expect(requests[0].body).toContain("correct-password");
  });
});
