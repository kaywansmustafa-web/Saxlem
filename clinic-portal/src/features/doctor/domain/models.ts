import type { QueueHealth, QueueSnapshot } from "@/features/live-queue/domain/models";
export type DoctorSessionState="active"|"paused"|"finished";
export type DoctorAction="pause"|"resume"|"complete"|"finish";
export interface DoctorIdentity{id:string;name:string;specialty:string;clinicId:string;clinicName:string;room:string;workingSession:string;role:"doctor"}
export interface DoctorSession{id:string;version:number;state:DoctorSessionState;doctor:DoctorIdentity;queueId:string;consultationStartedAt:string;completedOperationIds:string[];activity:DoctorActivity[]}
export interface DoctorActivity{id:string;kind:"sessionStarted"|"patientCalled"|"consultationStarted"|"patientRecalled"|"consultationCompleted"|"sessionPaused"|"sessionResumed"|"sessionFinished";occurredAt:string;patientName?:string}
export interface DoctorPatientContext{appointmentId:string;patientId:string;name:string;age:number;gender:string;appointmentTime:string;appointmentType:string;familyContext?:string;queueNumber:number;arrivalState:string;consultationStartedAt:string;estimatedRemainingMinutes:number;importantNote:string;clinic:string;room:string;durationMinutes:number;arrivalTime:string;queueHistory:string;recentUpdate:string}
export interface DoctorNextPatient{appointmentId:string;patientId:string;name:string;queueNumber:number;appointmentTime:string;arrivalState:string;estimatedWaitMinutes:number}
export interface DoctorWorkspaceProjection{session:DoctorSession;currentTime:string;queueState:QueueSnapshot["lifecycle"];waitingCount:number;queueHealth:QueueHealth;averageWaitMinutes:number;doctorDelayMinutes:number;current:DoctorPatientContext|null;next:DoctorNextPatient[];activity:DoctorActivity[]}
export interface DoctorActionResult{projection:DoctorWorkspaceProjection;idempotent:boolean;action:DoctorAction}
