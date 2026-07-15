export type ArrivalStatus="expected"|"arrived"|"waiting";export type PatientStatus="active"|"family";
export interface AppointmentSummary{id:string;date:string;time:string;doctor:string;clinic:string;status:string;queueNumber?:string;estimatedWaitMinutes?:number}
export interface FamilyMember{id:string;name:string;relationship:string;age:number}
export interface PatientNotification{id:string;type:"confirmed"|"reminder"|"queue"|"delay";occurredAt:string}
export interface PatientSummary{id:string;firstName:string;lastName:string;phone:string;age:number;gender:string;relationship?:string;lastAppointment?:string;nextAppointment?:string;status:PatientStatus;today?:AppointmentSummary;recentlyViewedRank?:number}
export interface PatientWorkspace{patient:PatientSummary;today?:AppointmentSummary;upcoming:AppointmentSummary[];family:FamilyMember[];notifications:PatientNotification[]}
export const fullName=(patient:PatientSummary)=>`${patient.firstName} ${patient.lastName}`;
