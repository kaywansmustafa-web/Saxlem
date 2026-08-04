import type { DoctorWorkspaceProjection } from "@/features/doctor/domain/models";
import type { DoctorPatientsProjection } from "../domain/models";

export function projectDoctorPatients(
  workspace: DoctorWorkspaceProjection,
): DoctorPatientsProjection {
  return Object.freeze({
    sessionState: workspace.session.state,
    doctorName: workspace.session.doctor.name,
    clinicName: workspace.session.doctor.clinicName,
    room: workspace.session.doctor.room,
    current: workspace.current,
    next: Object.freeze([...workspace.next]),
    totalVisible: (workspace.current ? 1 : 0) + workspace.next.length,
  });
}
