import { describe, expect, it } from "vitest";
import {
  invalidSecretExample,
  parseOwnerConfiguration,
} from "@/infrastructure/config";
const secret = Buffer.from(Array.from({ length: 32 }, (_, index) => index + 1)).toString("base64url");
const base = {
  SAXLEM_OWNER_ENV: "development",
  SAXLEM_BACKEND_API_URL: "http://127.0.0.1:3001",
  SAXLEM_OWNER_SESSION_SECRET: secret,
  SAXLEM_OWNER_REQUEST_TIMEOUT_MS: "8000",
};
describe("owner environment", () => {
  it("accepts explicit local development and production HTTPS", () => {
    expect(parseOwnerConfiguration(base).environment).toBe("development");
    expect(
      parseOwnerConfiguration({
        ...base,
        SAXLEM_OWNER_ENV: "production",
        SAXLEM_BACKEND_API_URL: "https://api.saxlem.test",
      }).environment,
    ).toBe("production");
  });
  it.each([
    { SAXLEM_BACKEND_API_URL: undefined },
    { SAXLEM_OWNER_SESSION_SECRET: invalidSecretExample },
    { SAXLEM_OWNER_SESSION_SECRET: "AAAA" },
    { SAXLEM_BACKEND_API_URL: "https://user:pass@api.saxlem.test" },
    { SAXLEM_BACKEND_API_URL: "https://api.saxlem.test/path" },
    { SAXLEM_OWNER_ENV: "qa", SAXLEM_BACKEND_API_URL: "http://127.0.0.1:3001" },
    { SAXLEM_OWNER_ENV: "unknown" },
  ])("fails closed for unsafe configuration %j", (override) =>
    expect(() => parseOwnerConfiguration({ ...base, ...override })).toThrow(
      "unavailable",
    ),
  );
});
