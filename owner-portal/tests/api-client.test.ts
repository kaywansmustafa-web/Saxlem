import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { OwnerApiClient, OwnerApiError } from "@/infrastructure/api-client";
const configuration = {
  backendUrl: new URL("https://api.saxlem.test"),
  timeoutMs: 1000,
};
describe("owner API client", () => {
  it("validates JSON and never follows redirects", async () => {
    const transport = vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ status: "ok" }), {
            headers: { "content-type": "application/json" },
          }),
        ),
      client = new OwnerApiClient(configuration, transport);
    await expect(
      client.request({
        path: "/api/v1/health/live",
        schema: z.object({ status: z.literal("ok") }),
      }),
    ).resolves.toEqual({ status: "ok" });
    expect(transport.mock.calls[0][1].redirect).toBe("error");
  });
  it("rejects escaping paths before transport", async () => {
    const transport = vi.fn(),
      client = new OwnerApiClient(configuration, transport);
    await expect(
      client.request({ path: "/api/v1/../secret" }),
    ).rejects.toBeInstanceOf(OwnerApiError);
    expect(transport).not.toHaveBeenCalled();
  });
  it("does not forward tenant headers for the global owner", async () => {
    const transport = vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ ok: true }), {
            headers: { "content-type": "application/json" },
          }),
        ),
      client = new OwnerApiClient(configuration, transport);
    await client.request({
      path: "/api/v1/test",
      session: {
        userId: "1",
        sessionId: "2",
        deviceId: "3",
        userAgent: "x",
        accessToken: "secret-token",
        refreshToken: "refresh",
        accessExpiresAt: 1,
        sessionExpiresAt: 2,
      },
    });
    const headers = new Headers(transport.mock.calls[0][1].headers);
    expect(headers.get("authorization")).toBe("Bearer secret-token");
    expect(headers.has("x-organization-id")).toBe(false);
    expect(headers.has("x-clinic-id")).toBe(false);
  });
});
