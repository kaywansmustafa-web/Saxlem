// Turns backend codes into words people read: "platformAdministrator" →
// "Platform administrator", "appointment.page_viewed" → "Appointment page viewed".
const known: Record<string, string> = {
  platformAdministrator: "Platform administrator",
  clinicManager: "Clinic manager",
  organizationAdministrator: "Organization administrator",
  receptionist: "Receptionist",
  doctor: "Doctor",
  initial: "First visit",
  followUp: "Follow-up",
  noShow: "No-show",
  succeeded: "Succeeded",
  development: "Development",
  badiniKurdish: "Kurdish (Badini)",
  soraniKurdish: "Kurdish (Sorani)",
  kurdish: "Kurdish",
  arabic: "Arabic",
  english: "English",
  turkish: "Turkish",
  persian: "Persian",
};

export function humanize(value: string | null | undefined): string {
  if (!value) return "—";
  if (known[value]) return known[value];
  const words = value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[._-]+/g, " ")
    .trim()
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const positive = new Set([
  "active",
  "completed",
  "finalized",
  "succeeded",
  "confirmed",
  "arrived",
]);
const negative = new Set([
  "inactive",
  "cancelled",
  "failed",
  "denied",
  "rejected",
  "noShow",
  "suspended",
]);
const informative = new Set([
  "scheduled",
  "inConsultation",
  "called",
  "pending",
]);

export function statusTone(
  value: string,
): "success" | "danger" | "info" | "warning" {
  if (positive.has(value)) return "success";
  if (negative.has(value)) return "danger";
  if (informative.has(value)) return "info";
  return "warning";
}
