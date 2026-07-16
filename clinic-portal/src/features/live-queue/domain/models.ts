export type QueueLifecycle = "closed" | "open" | "paused";
export type QueueHealth = "healthy" | "busy" | "delayed";
export type QueuePatientState = "queueReady" | "called" | "inConsultation" | "completed" | "noResponse";
export type QueueOperation = "open" | "pause" | "resume" | "callNext" | "recall" | "noResponse" | "complete";

export interface QueuePatient {
  appointmentId: string;
  patientId: string;
  name: string;
  number: number;
  doctor: string;
  arrival: "arrived" | "waiting";
  state: QueuePatientState;
  estimatedWaitMinutes: number;
  elapsedMinutes?: number;
}

export interface QueueActivity {
  id: string;
  kind: "opened" | "paused" | "resumed" | "called" | "recalled" | "noResponse" | "completed";
  patientName?: string;
  occurredAt: string;
}

export interface LiveQueue {
  id: string;
  clinicId: string;
  clinicName: string;
  doctorId: string;
  doctorName: string;
  version: number;
  lifecycle: QueueLifecycle;
  currentNumber: number | null;
  averageWaitMinutes: number;
  doctorDelayMinutes: number;
  patients: QueuePatient[];
  activity: QueueActivity[];
}

export interface QueueSnapshot extends LiveQueue {
  health: QueueHealth;
  current: QueuePatient | null;
  next: QueuePatient[];
  waiting: QueuePatient[];
}

export interface QueueOperationResult {
  snapshot: QueueSnapshot;
  idempotent: boolean;
  changed: QueueOperation;
  previousCurrent?: string;
  currentPatient?: string;
  nextPatient?: string;
}
