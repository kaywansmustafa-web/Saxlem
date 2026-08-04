import type {
  DoctorNextPatient,
  DoctorPatientContext,
  DoctorSessionState,
} from "@/features/doctor/domain/models";

export interface DoctorPatientsProjection {
  readonly sessionState: DoctorSessionState;
  readonly doctorName: string;
  readonly clinicName: string;
  readonly room: string;
  readonly current: DoctorPatientContext | null;
  readonly next: readonly DoctorNextPatient[];
  readonly totalVisible: number;
}
