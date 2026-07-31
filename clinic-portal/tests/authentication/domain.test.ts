// @vitest-environment node

import { describe, expect, it } from "vitest";
import {
  AuthenticationContractError,
  parseStaffRole,
  sessionFromTokenResponse,
} from "@/features/authentication/domain/auth-models";
import { ids, tokenResponse } from "./fixtures";

describe("authentication domain", () => {
  it.each([
    "receptionist",
    "doctor",
    "clinicManager",
    "platformAdministrator",
  ])("accepts the portal staff role %s", (role) => {
    expect(parseStaffRole(role)).toBe(role);
  });

  it.each(["patient", "owner", "", undefined])(
    "rejects unsupported role %s",
    (role) => {
      expect(() => parseStaffRole(role)).toThrow(AuthenticationContractError);
    },
  );

  it("rejects a patient token", async () => {
    const response = await tokenResponse("patient");
    expect(() =>
      sessionFromTokenResponse(response, ids.device, "Test Browser"),
    ).toThrow(AuthenticationContractError);
  });

  it("rejects staff tenant roles without organization and clinic context", async () => {
    const response = await tokenResponse("receptionist");
    const parts = response.accessToken.split(".");
    const claims = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    ) as Record<string, unknown>;
    delete claims.org;
    delete claims.clinic;
    const altered = `${parts[0]}.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.${parts[2]}`;
    expect(() =>
      sessionFromTokenResponse(
        { ...response, accessToken: altered },
        ids.device,
        "Test Browser",
      ),
    ).toThrow(AuthenticationContractError);
  });
});
