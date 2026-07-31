/** Production-safe legacy composition. Unfinished workflows fail closed. */
import type { AppointmentServices, DashboardServices, DoctorDevelopmentSession, DoctorNotificationServices, DoctorScheduleServices, DoctorServices, DoctorSettingsServices, LegacyEnvironment, LiveQueueServices, PatientServices, ReceptionistDevelopmentSession } from "./contracts";

export const environment = (value?: string): LegacyEnvironment => {
  void value;
  return "production";
};
export const getSession = (): ReceptionistDevelopmentSession | null => null;
export const getDoctorSession = (environmentName?: string, enabled?: string): DoctorDevelopmentSession | null => {
  void environmentName;
  void enabled;
  return null;
};
export const canAccessDoctorWorkspace = (session?: DoctorDevelopmentSession | null, clinicId?: string, doctorId?: string): boolean => {
  void session;
  void clinicId;
  void doctorId;
  return false;
};
export const dashboardService = (): DashboardServices => null;
export const patientServices = (): PatientServices => null;
export const appointmentServices = (): AppointmentServices => null;
export const liveQueueServices = (): LiveQueueServices => null;
export const doctorServices = (): DoctorServices => null;
export const doctorScheduleServices = (): DoctorScheduleServices => null;
export const doctorNotificationServices = (): DoctorNotificationServices => null;
export const doctorSettingsServices = (): DoctorSettingsServices => null;
