import type { AppointmentRepository } from "@/features/appointments/domain/repository";
import type { LiveQueueRepository } from "../domain/repository";
import type { QueueOperation, QueueOperationResult, QueueSnapshot } from "../domain/models";
import { currentPatient, eligiblePatients, snapshot } from "../domain/queue-rules";

export interface Clock { now(): Date }
export class GetLiveQueue { constructor(private readonly repository: LiveQueueRepository) {} async execute(id: string): Promise<QueueSnapshot | null> { const queue = await this.repository.get(id); return queue ? snapshot(queue) : null; } }
export class OperateQueue {
  constructor(private readonly repository: LiveQueueRepository, private readonly appointments: AppointmentRepository, private readonly clock: Clock) {}
  async execute(input: { queueId: string; operation: QueueOperation; expectedVersion: number; operationId: string }): Promise<QueueOperationResult> {
    const before = await this.repository.get(input.queueId);
    const previous = before ? currentPatient(before) : null;
    const result = await this.repository.apply({ ...input, occurredAt: this.clock.now().toISOString() });
    const current = currentPatient(result.queue);
    if (!result.idempotent) await this.appointments.syncQueueState(result.queue);
    return { snapshot: snapshot(result.queue), idempotent: result.idempotent, changed: input.operation, previousCurrent: previous?.name, currentPatient: current?.name, nextPatient: eligiblePatients(result.queue)[0]?.name };
  }
}
