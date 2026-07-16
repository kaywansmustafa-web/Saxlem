import type { LiveQueue, QueueHealth, QueuePatient, QueueSnapshot } from "./models";

export type QueueFailure = "notFound" | "stale" | "closed" | "paused" | "alreadyOpen" | "notOpen" | "empty" | "noCurrent" | "invalidTransition";
export class QueueError extends Error { constructor(public readonly kind: QueueFailure) { super(kind); } }

export const currentPatient = (queue: LiveQueue) => queue.patients.find((patient) => patient.state === "called" || patient.state === "inConsultation") ?? null;
export const eligiblePatients = (queue: LiveQueue) => queue.patients.filter((patient) => patient.state === "queueReady").sort((a, b) => a.number - b.number);

export function queueHealth(queue: LiveQueue): QueueHealth {
  if (queue.doctorDelayMinutes >= 15 || queue.averageWaitMinutes >= 35) return "delayed";
  if (eligiblePatients(queue).length >= 4 || queue.averageWaitMinutes >= 20) return "busy";
  return "healthy";
}

export function snapshot(queue: LiveQueue): QueueSnapshot {
  const current = currentPatient(queue);
  const waiting = eligiblePatients(queue);
  return { ...structuredClone(queue), health: queueHealth(queue), current: current ? structuredClone(current) : null, next: structuredClone(waiting.slice(0, 3)), waiting: structuredClone(waiting) };
}

export function recalculate(queue: LiveQueue, patients: QueuePatient[]): LiveQueue {
  const waiting = patients.filter((patient) => patient.state === "queueReady");
  return { ...queue, patients, currentNumber: currentPatient({ ...queue, patients })?.number ?? null, averageWaitMinutes: waiting.length ? Math.round(waiting.reduce((sum, patient) => sum + patient.estimatedWaitMinutes, 0) / waiting.length) : 0 };
}
