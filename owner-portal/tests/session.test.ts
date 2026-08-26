import { describe, expect, it } from "vitest";
import { ownerSessionFromTokens } from "@/domain/session";
import {
  OwnerSessionCookie,
  safeReturnPath,
} from "@/infrastructure/session-cookie";
const secret = Buffer.from(Array.from({ length: 32 }, (_, index) => index + 1)).toString("base64url");
const configuration = {
  environment: "production" as const,
  backendUrl: new URL("https://api.saxlem.test"),
  sessionSecret: secret,
  timeoutMs: 8000,
};
function token(role: string) {
  const now = Math.floor(Date.now() / 1000);
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: "11111111-1111-4111-8111-111111111111", sid: "22222222-2222-4222-8222-222222222222", typ: "access", role, iss: "saxlem", aud: "saxlem-clients", iat: now, exp: now + 900 })}.${"x".repeat(43)}`;
}
describe("owner session", () => {
  it("accepts only the global platform administrator claim", async () => {
    const accessToken = token("platformAdministrator"),
      session = ownerSessionFromTokens(
        { accessToken, refreshToken: "r".repeat(40), expiresInSeconds: 900 },
        "33333333-3333-4333-8333-333333333333",
        "test",
      );
    expect(session.userId).toBe("11111111-1111-4111-8111-111111111111");
    for (const role of ["patient", "receptionist", "doctor", "clinicManager"]) {
      const invalid = token(role);
      expect(() =>
        ownerSessionFromTokens(
          {
            accessToken: invalid,
            refreshToken: "r".repeat(40),
            expiresInSeconds: 900,
          },
          "33333333-3333-4333-8333-333333333333",
          "test",
        ),
      ).toThrow();
    }
  });
  it("encrypts, restores, rejects malformed cookies and enforces owner audience", async () => {
    const accessToken = token("platformAdministrator"),
      session = ownerSessionFromTokens(
        { accessToken, refreshToken: "r".repeat(40), expiresInSeconds: 900 },
        "33333333-3333-4333-8333-333333333333",
        "test",
      ),
      cookie = new OwnerSessionCookie(configuration),
      sealed = await cookie.seal(session);
    expect(sealed).not.toContain(accessToken);
    expect(await cookie.unseal(sealed)).toMatchObject({
      userId: session.userId,
    });
    expect(await cookie.unseal(`${sealed}x`)).toBeNull();
  });
  it("allows only local non-API return paths", () => {
    expect(safeReturnPath("/organizations?status=active")).toBe(
      "/organizations?status=active",
    );
    for (const value of [
      "https://evil.test",
      "//evil.test",
      "/api/auth",
      "/\\evil",
    ])
      expect(safeReturnPath(value)).toBe("/dashboard");
  });
});
