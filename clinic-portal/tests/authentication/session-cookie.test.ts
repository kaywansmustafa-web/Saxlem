// @vitest-environment node

import { describe, expect, it } from "vitest";
import {
  PortalSessionCookie,
  portalSessionCookieOptions,
  safeReturnPath,
} from "@/infrastructure/auth/session-cookie";
import { configuration, session } from "./fixtures";

describe("sealed portal session", () => {
  it("encrypts and authenticates session contents", async () => {
    const manager = new PortalSessionCookie(configuration());
    const source = await session();
    const sealed = await manager.seal(source);
    expect(sealed).not.toContain(source.accessToken);
    expect(sealed).not.toContain(source.refreshToken);
    await expect(manager.unseal(sealed)).resolves.toMatchObject({
      userId: source.userId,
      role: "receptionist",
    });
  });

  it("rejects malformed and expired cookies", async () => {
    const manager = new PortalSessionCookie(configuration());
    await expect(manager.unseal("malformed")).resolves.toBeNull();
    const expired = await manager.seal(
      await session({ sessionExpiresAt: Date.now() - 1_000 }),
    );
    await expect(manager.unseal(expired)).resolves.toBeNull();
  });

  it("uses hardened production cookie flags", () => {
    expect(portalSessionCookieOptions("production")).toEqual({
      httpOnly: true,
      sameSite: "strict",
      secure: true,
      path: "/",
      maxAge: 2_592_000,
      priority: "high",
    });
  });

  it.each([
    "https://evil.test",
    "//evil.test/path",
    "/\\evil.test",
    "javascript:alert(1)",
    "/ok\nSet-Cookie:test",
  ])("rejects unsafe return path %s", (candidate) => {
    expect(safeReturnPath(candidate)).toBe("/en/dashboard");
  });

  it("preserves a safe same-origin localized return path", () => {
    expect(safeReturnPath("/ar/appointments?today=true")).toBe(
      "/ar/appointments?today=true",
    );
  });
});
