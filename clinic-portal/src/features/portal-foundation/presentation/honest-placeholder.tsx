import type { RoutePolicy } from "../domain/route-policy";
import type { FoundationMessages } from "./foundation-messages";
const labels: Record<RoutePolicy["id"], keyof FoundationMessages> = {
  dashboard: "dashboard",
  patients: "patients",
  appointments: "appointments",
  liveQueue: "liveQueue",
  doctors: "doctors",
  schedule: "schedule",
  notifications: "notifications",
  settings: "settings",
  doctorWorkspace: "workspace",
  doctorPatients: "todayPatients",
  doctorSchedule: "schedule",
  doctorNotifications: "notifications",
  doctorSettings: "settings",
  clinicManagement: "clinicManagement",
  administration: "administration",
  organizations: "organizations",
  clinics: "clinics",
  billing: "billing",
};
/** A calm "coming soon" card for sections that are not built yet. It names
 * the section and says plainly that it is not available; no internal plan
 * names, no controls that pretend to work. */
export function HonestPlaceholder({
  route,
  m,
}: {
  route: RoutePolicy;
  m: FoundationMessages;
}) {
  return (
    <section className="honest-placeholder">
      <span className="placeholder-icon" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          width="30"
          height="30"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
        </svg>
      </span>
      <h1>{m[labels[route.id]]}</h1>
      <p className="placeholder-pill">{m.featureUnavailable}</p>
      <p>{m.comingSoonBody}</p>
    </section>
  );
}
