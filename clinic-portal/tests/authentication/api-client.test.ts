// @vitest-environment node

import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { BackendApiClient } from "@/infrastructure/api/api-client";
import { PortalApiError } from "@/infrastructure/api/api-error";
import { configuration, session } from "./fixtures";

describe("backend API client", () => {
  it("aborts requests at the configured timeout", async () => {
    vi.useFakeTimers();
    const transport = vi.fn(
      (_url: URL | RequestInfo, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          );
        }),
    );
    const client = new BackendApiClient(
      configuration({ requestTimeoutMs: 1_000 }),
      transport,
    );
    const pending = client.request({
      path: "/api/v1/auth/login",
      schema: z.object({ ok: z.boolean() }),
    });
    const assertion = expect(pending).rejects.toMatchObject({
      detail: { kind: "timeout", status: 504 },
    });
    await vi.advanceTimersByTimeAsync(1_001);
    await assertion;
    vi.useRealTimers();
  });

  it("rejects invalid JSON without leaking the response", async () => {
    const client = new BackendApiClient(
      configuration(),
      vi.fn().mockResolvedValue(new Response("not-json", { status: 200 })),
    );
    await expect(
      client.request({ path: "/api/v1/auth/login", schema: z.object({}) }),
    ).rejects.toBeInstanceOf(PortalApiError);
  });

  it("rejects an unexpected response content type", async () => {
    const client = new BackendApiClient(
      configuration(),
      vi.fn().mockResolvedValue(
        new Response("<html>backend error</html>", {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
      ),
    );
    await expect(client.request({ path: "/api/v1/auth/login" })).rejects.toMatchObject({
      detail: { kind: "invalidResponse" },
    });
  });

  it("rejects an oversized backend response before parsing", async () => {
    const transport = vi.fn().mockResolvedValue(
      new Response("{}", {
        status: 200,
        headers: {
          "content-type": "application/json",
          "content-length": "1048577",
        },
      }),
    );
    const client = new BackendApiClient(configuration(), transport);
    await expect(client.request({ path: "/api/v1/auth/login" })).rejects.toMatchObject({
      detail: { kind: "invalidResponse" },
    });
    expect(transport).toHaveBeenCalledOnce();
  });

  it("normalizes backend errors and preserves the request ID", async () => {
    const client = new BackendApiClient(
      configuration(),
      vi.fn().mockResolvedValue(
        Response.json(
          {
            error: {
              code: "LOGIN_DENIED",
              message: "Sensitive backend text",
              requestId: "request-from-envelope",
              retryable: false,
              fieldErrors: [],
            },
          },
          { status: 401, headers: { "x-request-id": "header-request" } },
        ),
      ),
    );
    await expect(
      client.request({ path: "/api/v1/auth/login" }),
    ).rejects.toMatchObject({
      detail: {
        kind: "unauthorized",
        code: "LOGIN_DENIED",
        requestId: "request-from-envelope",
        message: "Your email or password is incorrect.",
      },
    });
  });

  it("drops unsafe request IDs", async () => {
    const client = new BackendApiClient(
      configuration(),
      vi.fn().mockResolvedValue(
        Response.json(
          { error: { code: "FAILED", message: "detail", requestId: "bad\nrequest", retryable: false } },
          { status: 500, headers: { "x-request-id": "also unsafe value" } },
        ),
      ),
    );
    await expect(client.request({ path: "/api/v1/auth/login" })).rejects.toMatchObject({
      detail: { requestId: undefined },
    });
  });

  it("supports a 204 response without parsing JSON", async () => {
    const client = new BackendApiClient(
      configuration(),
      vi.fn().mockResolvedValue(
        new Response(null, {
          status: 204,
          headers: { "x-request-id": "logout-request" },
        }),
      ),
    );
    await expect(
      client.request({ path: "/api/v1/auth/logout", method: "POST" }),
    ).resolves.toEqual({
      data: undefined,
      status: 204,
      requestId: "logout-request",
    });
  });

  it("derives bearer and tenant headers only from sealed session state", async () => {
    const authenticated = await session();
    const transport = vi.fn().mockResolvedValue(
      Response.json({ ok: true }, { status: 200 }),
    );
    const client = new BackendApiClient(configuration(), transport);
    await client.request({
      path: "/api/v1/notifications",
      session: authenticated,
      schema: z.object({ ok: z.boolean() }),
    });
    const headers = transport.mock.calls[0][1]?.headers as Headers;
    expect(headers.get("authorization")).toBe(
      `Bearer ${authenticated.accessToken}`,
    );
    expect(headers.get("x-organization-id")).toBe(
      authenticated.context?.organizationId,
    );
    expect(headers.get("x-clinic-id")).toBe(
      authenticated.context?.clinicId,
    );
  });

  it.each([301, 302, 303, 307, 308])(
    "never follows %i redirects or replays sensitive requests",
    async (status) => {
      const authenticated = await session();
      const transport = vi.fn().mockResolvedValue(
        new Response(null, {
          status,
          headers: { location: "https://attacker.test/collect" },
        }),
      );
      const client = new BackendApiClient(configuration(), transport);

      await expect(
        client.request({
          path: "/api/v1/auth/logout",
          method: "POST",
          body: { refreshToken: authenticated.refreshToken },
          session: authenticated,
        }),
      ).rejects.toBeInstanceOf(PortalApiError);

      expect(transport).toHaveBeenCalledTimes(1);
      const init = transport.mock.calls[0][1] as RequestInit;
      expect(init.redirect).toBe("error");
      expect(init.body).toBe(JSON.stringify({ refreshToken: authenticated.refreshToken }));
    },
  );

  it("does not follow same-origin redirects or replay authorization and tenant headers", async () => {
    const authenticated = await session();
    const transport = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 307,
        headers: { location: "http://backend.test/api/v1/other" },
      }),
    );
    const client = new BackendApiClient(configuration(), transport);
    await expect(client.request({
      path: "/api/v1/notifications",
      method: "POST",
      session: authenticated,
    })).rejects.toBeInstanceOf(PortalApiError);
    expect(transport).toHaveBeenCalledTimes(1);
    expect((transport.mock.calls[0][1] as RequestInit).redirect).toBe("error");
  });

  it.each([
    "https://attacker.test/api/v1/auth/login",
    "//attacker.test/api/v1/auth/login",
    "/api/v1/../admin",
    "/api/v1\\auth\\login",
    "/api/v1//auth/login",
  ])("rejects malformed or origin-escaping path before fetch: %s", async (path) => {
    const transport = vi.fn();
    const client = new BackendApiClient(configuration(), transport);
    await expect(client.request({ path: path as `/api/v1/${string}` })).rejects.toBeInstanceOf(PortalApiError);
    expect(transport).not.toHaveBeenCalled();
  });
});
