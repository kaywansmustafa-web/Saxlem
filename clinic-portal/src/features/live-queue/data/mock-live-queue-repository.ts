import type { LiveQueueRepository, QueueCommand, QueueRepositoryResult } from "../domain/repository";
import type { LiveQueue } from "../domain/models";
import { currentPatient, eligiblePatients, QueueError, recalculate } from "../domain/queue-rules";

const seed: LiveQueue = {
  id: "queue-karwan", clinicId: "duhok-central", clinicName: "Saxlem Medical Center", doctorId: "D-2", doctorName: "Dr. Karwan Ahmed",
  version: 1, lifecycle: "open", currentNumber: 18, averageWaitMinutes: 19, doctorDelayMinutes: 12,
  patients: [
    { appointmentId: "APT-302", patientId: "PT-1008", name: "Rojin Salih", number: 18, doctor: "Dr. Karwan Ahmed", arrival: "arrived", state: "inConsultation", estimatedWaitMinutes: 0, elapsedMinutes: 9 },
    { appointmentId: "APT-305", patientId: "PT-1099", name: "Narin Omer", number: 20, doctor: "Dr. Karwan Ahmed", arrival: "waiting", state: "queueReady", estimatedWaitMinutes: 12 },
    { appointmentId: "APT-301", patientId: "PT-1042", name: "Dilan Barwari", number: 24, doctor: "Dr. Ava Hassan", arrival: "waiting", state: "queueReady", estimatedWaitMinutes: 20 },
    { appointmentId: "APT-304", patientId: "PT-1201", name: "Ari Barwari", number: 26, doctor: "Dr. Ava Hassan", arrival: "waiting", state: "queueReady", estimatedWaitMinutes: 28 },
    { appointmentId: "APT-303", patientId: "PT-1156", name: "Azad Miran", number: 28, doctor: "Dr. Shilan Omar", arrival: "waiting", state: "queueReady", estimatedWaitMinutes: 36 },
  ],
  activity: [{ id: "activity-initial", kind: "called", patientName: "Rojin Salih", occurredAt: "2026-07-16T08:20:00.000Z" }],
};

export class MockLiveQueueRepository implements LiveQueueRepository {
  private queue = structuredClone(seed);
  private results = new Map<string, LiveQueue>();
  constructor(lifecycle?: LiveQueue["lifecycle"]) { if (lifecycle) this.queue.lifecycle = lifecycle; }
  async get(queueId: string) { return queueId === this.queue.id ? structuredClone(this.queue) : null; }
  async apply(command: QueueCommand): Promise<QueueRepositoryResult> {
    if (command.queueId !== this.queue.id) throw new QueueError("notFound");
    const repeated = this.results.get(command.operationId);
    if (repeated) return { queue: structuredClone(repeated), idempotent: true };
    if (command.expectedVersion !== this.queue.version) throw new QueueError("stale");
    let patients = structuredClone(this.queue.patients);
    const current = currentPatient(this.queue);
    const next = eligiblePatients(this.queue)[0];
    if (command.operation === "open") { if (this.queue.lifecycle !== "closed") throw new QueueError("alreadyOpen"); this.queue.lifecycle = "open"; }
    if (command.operation === "pause") { if (this.queue.lifecycle !== "open") throw new QueueError("notOpen"); this.queue.lifecycle = "paused"; }
    if (command.operation === "resume") { if (this.queue.lifecycle !== "paused") throw new QueueError("invalidTransition"); this.queue.lifecycle = "open"; }
    if (["callNext", "recall", "noResponse", "complete"].includes(command.operation) && this.queue.lifecycle === "closed") throw new QueueError("closed");
    if (["callNext", "recall", "noResponse", "complete"].includes(command.operation) && this.queue.lifecycle === "paused") throw new QueueError("paused");
    if (command.operation === "callNext") {
      if (!next) throw new QueueError("empty");
      patients = patients.map((patient) => current && patient.patientId === current.patientId ? { ...patient, state: "completed" } : patient.patientId === next.patientId ? { ...patient, state: "called" } : patient);
    }
    if (command.operation === "recall") { if (!current) throw new QueueError("noCurrent"); patients = patients.map((patient) => patient.patientId === current.patientId ? { ...patient, state: "called" } : patient); }
    if (command.operation === "noResponse") { if (!current) throw new QueueError("noCurrent"); patients = patients.map((patient) => patient.patientId === current.patientId ? { ...patient, state: "noResponse" } : patient); }
    if (command.operation === "complete") { if (!current) throw new QueueError("noCurrent"); patients = patients.map((patient) => patient.patientId === current.patientId ? { ...patient, state: "completed" } : patient); }
    const activityKind = command.operation === "open" ? "opened" : command.operation === "pause" ? "paused" : command.operation === "resume" ? "resumed" : command.operation === "callNext" ? "called" : command.operation === "recall" ? "recalled" : command.operation === "complete" ? "completed" : "noResponse";
    this.queue = recalculate({ ...this.queue, version: this.queue.version + 1, activity: [{ id: command.operationId, kind: activityKind, patientName: command.operation === "callNext" ? next?.name : current?.name, occurredAt: command.occurredAt }, ...this.queue.activity] }, patients);
    this.results.set(command.operationId, structuredClone(this.queue));
    return { queue: structuredClone(this.queue), idempotent: false };
  }
}
