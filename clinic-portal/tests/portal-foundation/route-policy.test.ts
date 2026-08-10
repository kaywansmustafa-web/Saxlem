import { describe, expect, it } from "vitest";
import {
  allowed,
  landingRoute,
  navigationFor,
  routePolicies,
} from "@/features/portal-foundation/domain/route-policy";

const implementedRoutes = new Set([
  "doctorWorkspace",
  "doctorPatients",
  "doctorSchedule",
  "doctorNotifications",
  "administration",
  "organizations",
  "clinics",
]);

describe("central route policy", () => {
  it("keeps exact role navigation separate", () => {
    expect(navigationFor("receptionist").map((x) => x.id)).toEqual([
      "dashboard",
      "patients",
      "appointments",
      "liveQueue",
      "doctors",
      "schedule",
      "notifications",
      "settings",
    ]);

    expect(navigationFor("doctor").map((x) => x.id)).toEqual([
      "doctorWorkspace",
      "doctorPatients",
      "doctorSchedule",
      "doctorNotifications",
      "doctorSettings",
    ]);

    expect(
      navigationFor("platformAdministrator").map((x) => x.id),
    ).toEqual([
      "settings",
      "administration",
      "organizations",
      "clinics",
    ]);

    expect(
      navigationFor("doctor").some((x) => x.id === "liveQueue"),
    ).toBe(false);
  });

  it("isolates platform administration from clinic operations", () => {
    for (const id of [
      "dashboard",
      "patients",
      "appointments",
      "liveQueue",
      "doctors",
    ] as const) {
      expect(allowed(id, "platformAdministrator")).toBe(false);
    }
  });

  it("defines one landing route for every supported role", () => {
    expect(landingRoute("en", "receptionist")).toBe("/en/dashboard");
    expect(landingRoute("ar", "doctor")).toBe(
      "/ar/doctor/session",
    );
    expect(landingRoute("ku", "clinicManager")).toBe(
      "/ku/dashboard",
    );
    expect(landingRoute("en", "platformAdministrator")).toBe(
      "/en/administration",
    );
  });

  it("keeps registry identifiers unique and implementation status explicit", () => {
    expect(new Set(routePolicies.map((x) => x.id)).size).toBe(
      routePolicies.length,
    );

    expect(routePolicies.every((x) => Boolean(x.owner))).toBe(true);

    for (const route of routePolicies) {
      expect(route.placeholder).toBe(
        !implementedRoutes.has(route.id),
      );
    }
  });
});
