import type { Locale } from "@/i18n";
import type { ReceptionDoctors } from "../data/backend-reception-doctors";
import { receptionMessages } from "./messages";
import { ChooseDoctors, MyDoctorsBar } from "./my-doctors";

/** Full-page prompt shown until a receptionist has chosen their doctor. */
export function ReceptionSetup({
  view,
  locale,
}: {
  view: ReceptionDoctors;
  locale: Locale;
}) {
  return <ChooseDoctors doctors={view.doctors} m={receptionMessages(locale)} />;
}

/** "My doctors: Dr X · Add or remove", for receptionists only. */
export function ReceptionBar({
  view,
  locale,
}: {
  view: ReceptionDoctors | null;
  locale: Locale;
}) {
  if (!view?.configured) return null;
  return <MyDoctorsBar doctors={view.doctors} m={receptionMessages(locale)} />;
}

/** The ids a receptionist works for, or null when everything is shown. */
export const ownDoctorIds = (view: ReceptionDoctors | null) =>
  view?.configured
    ? new Set(view.doctors.filter((d) => d.assigned).map((d) => d.id))
    : null;
