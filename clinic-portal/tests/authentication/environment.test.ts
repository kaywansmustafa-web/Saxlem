// @vitest-environment node

import { describe, expect, it } from "vitest";
import {
  documentedInvalidSessionSecret,
  PortalConfigurationError,
  parsePortalConfiguration,
} from "@/infrastructure/config/environment";

const valid = {
  SAXLEM_PORTAL_ENV: "development",
  SAXLEM_BACKEND_API_URL: "http://localhost:3000",
  SAXLEM_PORTAL_SESSION_SECRET:
    "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY",
  SAXLEM_PORTAL_REQUEST_TIMEOUT_MS: "7000",
};

describe("portal environment", () => {
  it("validates an explicit development configuration", () => {
    const result = parsePortalConfiguration(valid);
    expect(result).toMatchObject({
      environment: "development",
      configurationWasExplicit: true,
      requestTimeoutMs: 7000,
    });
  });

  it.each([
    {},
    { ...valid, SAXLEM_BACKEND_API_URL: "" },
    { ...valid, SAXLEM_BACKEND_API_URL: "not-a-url" },
    { ...valid, SAXLEM_PORTAL_SESSION_SECRET: "short" },
    { ...valid, SAXLEM_PORTAL_REQUEST_TIMEOUT_MS: "999" },
    { ...valid, SAXLEM_PORTAL_REQUEST_TIMEOUT_MS: "15001" },
  ])("fails closed for missing or malformed configuration", (source) => {
    expect(() => parsePortalConfiguration(source)).toThrow(
      PortalConfigurationError,
    );
  });

  it.each([undefined, "", "unknown"])(
    "normalizes a missing or unknown environment to production-safe behavior",
    (environment) => {
      const result = parsePortalConfiguration({
        ...valid,
        SAXLEM_PORTAL_ENV: environment,
        SAXLEM_BACKEND_API_URL: "https://api.saxlem.test",
      });
      expect(result.environment).toBe("production");
      expect(result.configurationWasExplicit).toBe(false);
    },
  );

  it.each([undefined, "", "unknown"])(
    "requires HTTPS for production-safe fallback environment %s",
    (environment) => {
      expect(() =>
        parsePortalConfiguration({
          ...valid,
          SAXLEM_PORTAL_ENV: environment,
        }),
      ).toThrow(PortalConfigurationError);
    },
  );

  it.each(["qa", "production"])(
    "requires HTTPS outside development for %s",
    (environment) => {
      expect(() =>
        parsePortalConfiguration({
          ...valid,
          SAXLEM_PORTAL_ENV: environment,
        }),
      ).toThrow(PortalConfigurationError);
    },
  );

  it.each(["qa", "production"])(
    "accepts an explicit HTTPS %s configuration",
    (environment) => {
      expect(
        parsePortalConfiguration({
          ...valid,
          SAXLEM_PORTAL_ENV: environment,
          SAXLEM_BACKEND_API_URL: "https://api.saxlem.test",
        }).environment,
      ).toBe(environment);
    },
  );

  it.each([
    documentedInvalidSessionSecret,
    "%%%not-base64%%%",
    Buffer.alloc(31, 7).toString("base64url"),
    "A".repeat(48),
    Buffer.alloc(32, 65).toString("base64url"),
    Buffer.from("replace-this-placeholder-with-a-real-key").toString("base64url"),
  ])("rejects invalid or low-entropy session secret %s", (secret) => {
    expect(() =>
      parsePortalConfiguration({
        ...valid,
        SAXLEM_PORTAL_SESSION_SECRET: secret,
      }),
    ).toThrow(PortalConfigurationError);
  });

  it("accepts generated 32-byte base64url material", () => {
    const secret = Buffer.from(Array.from({ length: 32 }, (_, index) => index + 1)).toString("base64url");
    expect(
      parsePortalConfiguration({
        ...valid,
        SAXLEM_PORTAL_SESSION_SECRET: secret,
      }).sessionSecret,
    ).toBe(secret);
  });

  it.each(["qa", "production"])("rejects the documented placeholder in %s", (environment) => {
    expect(() => parsePortalConfiguration({
      ...valid,
      SAXLEM_PORTAL_ENV: environment,
      SAXLEM_BACKEND_API_URL: "https://api.saxlem.test",
      SAXLEM_PORTAL_SESSION_SECRET: documentedInvalidSessionSecret,
    })).toThrow(PortalConfigurationError);
  });
});
