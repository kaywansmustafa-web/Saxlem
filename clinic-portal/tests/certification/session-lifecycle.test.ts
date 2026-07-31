// @vitest-environment node

import { describe, expect, it, vi } from "vitest";
import { ClinicPortalAuthenticationService } from "@/features/authentication/application/authentication-service";
import type { BackendApiClient } from "@/infrastructure/api/api-client";
import { PortalSessionCookie } from "@/infrastructure/auth/session-cookie";
import { configuration, session, tokenResponse } from "../authentication/fixtures";

function barrier() {
  let release!: () => void;
  const wait = new Promise<void>((resolve) => { release = resolve; });
  return { wait, release };
}

describe("Sprint 13K-C session lifecycle certification", () => {
  it("single-flights concurrent refresh rotations for the same sealed session", async () => {
    const cookie = new PortalSessionCookie(configuration());
    const sealed = await cookie.seal(await session({ accessExpiresAt: Date.now() - 1 }));
    const gate = barrier();
    const request = vi.fn(async () => {
      await gate.wait;
      return { data: await tokenResponse(), status: 200 };
    });
    const first = new ClinicPortalAuthenticationService({ request } as unknown as BackendApiClient, cookie);
    const second = new ClinicPortalAuthenticationService({ request } as unknown as BackendApiClient, cookie);
    const a = first.restore(sealed);
    const b = second.restore(sealed);
    await vi.waitFor(() => expect(request).toHaveBeenCalledOnce());
    gate.release();
    const [left, right] = await Promise.all([a, b]);
    expect(left?.sealedSession).toBe(right?.sealedSession);
    expect(left?.rotated).toBe(true);
  });

  it("serializes refresh before logout and never overlaps backend mutations", async () => {
    const cookie = new PortalSessionCookie(configuration());
    const sealed = await cookie.seal(await session({ accessExpiresAt: Date.now() - 1 }));
    const gate = barrier();
    let active = 0;
    let maximum = 0;
    const calls: string[] = [];
    const request = vi.fn(async ({ path }: { path: string }) => {
      active += 1;
      maximum = Math.max(maximum, active);
      calls.push(path);
      if (path.endsWith("refresh")) await gate.wait;
      active -= 1;
      return path.endsWith("refresh")
        ? { data: await tokenResponse(), status: 200 }
        : { data: undefined, status: 204 };
    });
    const service = new ClinicPortalAuthenticationService({ request } as unknown as BackendApiClient, cookie);
    const restoring = service.restore(sealed);
    await vi.waitFor(() => expect(request).toHaveBeenCalledOnce());
    const loggingOut = service.logout(sealed);
    expect(request).toHaveBeenCalledOnce();
    gate.release();
    await Promise.all([restoring, loggingOut]);
    expect(calls).toEqual(["/api/v1/auth/refresh", "/api/v1/auth/logout"]);
    expect(maximum).toBe(1);
  });

  it("rejects absolute-expiry and malformed sessions without backend access", async () => {
    const cookie = new PortalSessionCookie(configuration());
    const request = vi.fn();
    const service = new ClinicPortalAuthenticationService({ request } as unknown as BackendApiClient, cookie);
    const expired = await cookie.seal(await session({ sessionExpiresAt: Date.now() - 1 }));
    expect(await service.restore(expired)).toBeNull();
    expect(await service.restore("malformed")).toBeNull();
    expect(request).not.toHaveBeenCalled();
  });
});
