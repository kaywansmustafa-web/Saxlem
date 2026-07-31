// @vitest-environment node

import { describe, expect, it, vi } from "vitest";
import { ClinicPortalAuthenticationService } from "@/features/authentication/application/authentication-service";
import type { BackendApiClient } from "@/infrastructure/api/api-client";
import { PortalApiError } from "@/infrastructure/api/api-error";
import { PortalSessionCookie } from "@/infrastructure/auth/session-cookie";
import { configuration, session, tokenResponse } from "./fixtures";

describe("authentication application service", () => {
  it("rotates refresh tokens and preserves identity context", async () => {
    const cookie = new PortalSessionCookie(configuration());
    const existing = await session({ accessExpiresAt: Date.now() - 1_000 });
    const sealed = await cookie.seal(existing);
    const rotatedTokens = await tokenResponse();
    const request = vi.fn().mockResolvedValue({
      data: rotatedTokens,
      status: 200,
    });
    const service = new ClinicPortalAuthenticationService(
      { request } as unknown as BackendApiClient,
      cookie,
    );
    const result = await service.restore(sealed);
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "/api/v1/auth/refresh",
        body: expect.objectContaining({
          refreshToken: existing.refreshToken,
          deviceId: existing.deviceId,
          userAgent: existing.deviceUserAgent,
        }),
      }),
    );
    expect(result).toMatchObject({ rotated: true });
    expect(result?.sealedSession).not.toBe(sealed);
  });

  it("propagates a safe failed-refresh error for cookie clearing by the route", async () => {
    const cookie = new PortalSessionCookie(configuration());
    const sealed = await cookie.seal(
      await session({ accessExpiresAt: Date.now() - 1_000 }),
    );
    const request = vi.fn().mockRejectedValue(
      new PortalApiError({
        kind: "unauthorized",
        status: 401,
        code: "SESSION_EXPIRED",
        message: "Your email or password is incorrect.",
        retryable: false,
      }),
    );
    const service = new ClinicPortalAuthenticationService(
      { request } as unknown as BackendApiClient,
      cookie,
    );
    await expect(service.restore(sealed)).rejects.toBeInstanceOf(PortalApiError);
  });
});
