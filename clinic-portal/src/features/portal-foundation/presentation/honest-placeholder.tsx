import type { RoutePolicy } from "../domain/route-policy";
import {
  foundationFormat,
  type FoundationMessages,
} from "./foundation-messages";
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
export function HonestPlaceholder({
  route,
  m,
}: {
  route: RoutePolicy;
  m: FoundationMessages;
}) {
  return (
    <section className="honest-placeholder">
      <h1>{m[labels[route.id]]}</h1>
      <p>{m.featureUnavailable}</p>
      <p>{foundationFormat(m.futureOwner, { owner: route.owner })}</p>
    </section>
  );
}
