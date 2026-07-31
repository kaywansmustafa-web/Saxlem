import type { RecordPatientArrival } from "@/features/appointments/domain/record-arrival";
import type { GetTodayAppointments, GetAppointmentWorkspace } from "@/features/appointments/application/appointment-services";
import type { GetDashboard } from "@/features/dashboard/application/get-dashboard";
import type { GetDoctorWorkspace, OperateDoctorSession } from "@/features/doctor/application/doctor-session-services";
import type { GetLiveQueue, OperateQueue } from "@/features/live-queue/application/operate-queue";
import type { GetPatients, GetPatientWorkspace } from "@/features/patients/application/patient-services";
import type { GetDoctorSchedule } from "@/features/doctor-schedule/application/get-doctor-schedule";
import type { GetDoctorNotifications, MarkDoctorNotificationRead } from "@/features/doctor-notifications/application/doctor-notification-services";
import type { GetDoctorSettings } from "@/features/doctor-settings/application/get-doctor-settings";

export type LegacyEnvironment = "development" | "production";
export interface ReceptionistDevelopmentSession { readonly name: string; readonly clinicId: string; readonly clinicName?: string }
export interface DoctorDevelopmentSession { readonly id: string; readonly role: "doctor"; readonly clinicId: string; readonly doctorId: string; readonly name?: string; readonly clinicName?: string }
export type DashboardServices = GetDashboard | null;
export type PatientServices = { readonly list: GetPatients; readonly workspace: GetPatientWorkspace } | null;
export type AppointmentServices = { readonly list: GetTodayAppointments; readonly workspace: GetAppointmentWorkspace; readonly arrival: RecordPatientArrival } | null;
export type LiveQueueServices = { readonly get: GetLiveQueue; readonly operate: OperateQueue } | null;
export type DoctorServices = { readonly session: DoctorDevelopmentSession; readonly get: GetDoctorWorkspace; readonly operate: OperateDoctorSession } | null;
export type DoctorScheduleServices = { readonly session: DoctorDevelopmentSession; readonly get: GetDoctorSchedule } | null;
export type DoctorNotificationServices = { readonly session: DoctorDevelopmentSession; readonly get: GetDoctorNotifications; readonly markRead: MarkDoctorNotificationRead } | null;
export type DoctorSettingsServices = { readonly session: DoctorDevelopmentSession; readonly get: GetDoctorSettings; readonly environment: LegacyEnvironment; readonly buildMode: string; readonly mockSessionEnabled: boolean } | null;
