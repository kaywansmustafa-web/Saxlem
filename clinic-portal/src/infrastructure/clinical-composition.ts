import "server-only";

import type { Locale } from "@/i18n";
import { BackendApiClient } from "./api/api-client";
import { portalConfiguration } from "./config/environment";
import { requireClinicalSession } from "./auth/authenticated-context";
import { BackendAppointmentRepository } from "@/features/appointments/data/backend-appointment-repository";
import { BackendPatientDirectoryRepository } from "@/features/patients/data/backend-patient-directory-repository";
import { BackendArrivalRepository } from "@/features/arrivals/data/backend-arrival-repository";
import { BackendDoctorDirectory } from "@/features/live-queue/data/backend-doctor-directory";
import { BackendQueueRepository } from "@/features/live-queue/data/backend-queue-repository";

export async function clinicalComposition(locale?: Locale) {
  const configuration = portalConfiguration();
  const session = await requireClinicalSession(locale);
  const api = new BackendApiClient(configuration);
  return Object.freeze({
    context: session.context!,
    appointments: new BackendAppointmentRepository(api, session),
    patients: new BackendPatientDirectoryRepository(api, session),
    arrivals: new BackendArrivalRepository(api, session),
    queueDoctors: new BackendDoctorDirectory(api, session),
    queues: new BackendQueueRepository(api, session),
  });
}
