import type { Locale } from "@/i18n";
import type { PortalStaffRole } from "@/features/authentication/domain/portal-access-types";

export type PortalRouteId =
  | "dashboard"
  | "patients"
  | "appointments"
  | "liveQueue"
  | "doctors"
  | "schedule"
  | "notifications"
  | "settings"
  | "doctorWorkspace"
  | "doctorPatients"
  | "doctorSchedule"
  | "doctorNotifications"
  | "doctorSettings"
  | "clinicManagement"
  | "administration"
  | "organizations"
  | "clinics"
  | "billing";
export interface RoutePolicy {
  readonly id: PortalRouteId;
  readonly segment: string;
  readonly roles: readonly PortalStaffRole[];
  readonly navigation: boolean;
  readonly landing: boolean;
  readonly placeholder: boolean;
  readonly owner: string;
}
const receptionist: PortalStaffRole[] = ["receptionist", "clinicManager"];
export const routePolicies: readonly RoutePolicy[] = Object.freeze([
  {
    id: "dashboard",
    segment: "dashboard",
    roles: receptionist,
    navigation: true,
    landing: true,
    placeholder: true,
    owner: "Sprint 13L",
  },
  {
    id: "patients",
    segment: "patients",
    roles: receptionist,
    navigation: true,
    landing: false,
    placeholder: true,
    owner: "Sprint 13L",
  },
  {
    id: "appointments",
    segment: "appointments",
    roles: receptionist,
    navigation: true,
    landing: false,
    placeholder: true,
    owner: "Sprint 13L",
  },
  {
    id: "liveQueue",
    segment: "live-queue",
    roles: receptionist,
    navigation: true,
    landing: false,
    placeholder: true,
    owner: "Sprint 13M",
  },
  {
    id: "doctors",
    segment: "doctors",
    roles: receptionist,
    navigation: true,
    landing: false,
    placeholder: true,
    owner: "Sprint 13L",
  },
  {
    id: "schedule",
    segment: "schedule",
    roles: ["receptionist"],
    navigation: true,
    landing: false,
    placeholder: true,
    owner: "Sprint 13L",
  },
  {
    id: "notifications",
    segment: "notifications",
    roles: receptionist,
    navigation: true,
    landing: false,
    placeholder: true,
    owner: "Sprint 13L",
  },
  {
    id: "settings",
    segment: "settings",
    roles: ["receptionist", "clinicManager", "platformAdministrator"],
    navigation: true,
    landing: false,
    placeholder: true,
    owner: "Sprint 13K-C",
  },
  {
    id: "doctorWorkspace",
    segment: "doctor/session",
    roles: ["doctor"],
    navigation: true,
    landing: true,
    placeholder: false,
    owner: "Sprint 13N",
  },
  {
    id: "doctorPatients",
    segment: "doctor/patients",
    roles: ["doctor"],
    navigation: true,
    landing: false,
    placeholder: false,
    owner: "Sprint 13N",
  },
  {
    id: "doctorSchedule",
    segment: "doctor/schedule",
    roles: ["doctor"],
    navigation: true,
    landing: false,
    placeholder: false,
    owner: "Sprint 13N",
  },
  {
    id: "doctorNotifications",
    segment: "doctor/notifications",
    roles: ["doctor"],
    navigation: true,
    landing: false,
    placeholder: false,
    owner: "Sprint 13N",
  },
  {
    id: "doctorSettings",
    segment: "doctor/settings",
    roles: ["doctor"],
    navigation: true,
    landing: false,
    placeholder: true,
    owner: "Sprint 13K-C",
  },
  {
    id: "clinicManagement",
    segment: "clinic-management",
    roles: ["clinicManager"],
    navigation: true,
    landing: false,
    placeholder: true,
    owner: "Sprint 13S",
  },
  {
    id: "administration",
    segment: "administration",
    roles: ["platformAdministrator"],
    navigation: true,
    landing: true,
    placeholder: false,
    owner: "Sprint 13S",
  },
  {
    id: "organizations",
    segment: "administration/organizations",
    roles: ["platformAdministrator"],
    navigation: true,
    landing: false,
    placeholder: false,
    owner: "Sprint 13S",
  },
  {
    id: "clinics",
    segment: "administration/clinics",
    roles: ["platformAdministrator"],
    navigation: true,
    landing: false,
    placeholder: false,
    owner: "Sprint 13S",
  },
  {
    id: "billing",
    segment: "billing",
    roles: ["clinicManager", "platformAdministrator"],
    navigation: true,
    landing: false,
    placeholder: false,
    owner: "Sprint 13T",
  },
]);
export const policy = (id: PortalRouteId) =>
  routePolicies.find((item) => item.id === id)!;
export const allowed = (id: PortalRouteId, role: PortalStaffRole) =>
  policy(id).roles.includes(role);
export const landingRoute = (locale: Locale, role: PortalStaffRole) =>
  `/${locale}/${routePolicies.find((item) => item.landing && item.roles.includes(role))?.segment ?? "login"}`;
export const routePath = (locale: Locale, id: PortalRouteId) =>
  `/${locale}/${policy(id).segment}`;
export const navigationFor = (role: PortalStaffRole) =>
  routePolicies.filter((item) => item.navigation && item.roles.includes(role));
export const sectionRoute = (segment: string): PortalRouteId | undefined =>
  routePolicies.find((item) => item.segment === segment)?.id;

export function safeRoleReturnPath(
  candidate: string,
  role: PortalStaffRole,
  fallbackLocale: Locale = "en",
): string {
  let parsed: URL;
  try {
    parsed = new URL(candidate, "https://portal.saxlem.invalid");
  } catch {
    return landingRoute(fallbackLocale, role);
  }
  const match = /^\/(en|ar|ku)\/(.+)$/u.exec(parsed.pathname);
  const locale = (match?.[1] as Locale | undefined) ?? fallbackLocale;
  if (!match) return landingRoute(locale, role);
  const matched = routePolicies.find((item) => item.segment === match[2]);
  return matched?.roles.includes(role)
    ? `${routePath(locale, matched.id)}${parsed.search}${parsed.hash}`
    : landingRoute(locale, role);
}
