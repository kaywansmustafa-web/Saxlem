import type {
  PatientQueueStatus,
  QueueAccess,
  QueueCommand,
  QueueEntryPage,
  QueuePolicy,
  QueueSnapshot,
} from './queue';

export interface QueueRepository {
  operationalDate(clinicId: string, now: Date): Promise<Date>;
  get(access: QueueAccess, id: string): Promise<QueueSnapshot | null>;
  getCurrent(
    access: QueueAccess,
    clinicId: string,
    doctorId: string,
    now: Date,
  ): Promise<QueueSnapshot | null>;
  getPatientStatus(
    access: QueueAccess,
    appointmentId: string,
    policy: QueuePolicy,
  ): Promise<PatientQueueStatus | null>;
  listEntries(
    access: QueueAccess,
    id: string,
    pageSize: number,
    cursor?: string,
    includeTerminal?: boolean,
  ): Promise<QueueEntryPage | null>;
  open(
    access: QueueAccess,
    clinicId: string,
    doctorId: string,
    operationalDate: Date,
    recallGraceMinutes: number,
    expectedVersion: number,
    now: Date,
    requestId: string,
    command: QueueCommand,
  ): Promise<QueueSnapshot>;
  enqueue(
    access: QueueAccess,
    id: string,
    appointmentId: string,
    expectedVersion: number,
    now: Date,
    requestId: string,
    command: QueueCommand,
  ): Promise<QueueSnapshot>;
  transitionSession(
    access: QueueAccess,
    id: string,
    operation: 'pause' | 'resume' | 'close',
    expectedVersion: number,
    reason: string | null,
    now: Date,
    requestId: string,
    command: QueueCommand,
  ): Promise<QueueSnapshot>;
  callNext(
    access: QueueAccess,
    id: string,
    expectedVersion: number,
    now: Date,
    requestId: string,
    command: QueueCommand,
  ): Promise<QueueSnapshot>;
  transitionEntry(
    access: QueueAccess,
    id: string,
    entryId: string,
    operation: 'recall' | 'no-response' | 'start' | 'complete',
    sessionVersion: number,
    entryVersion: number,
    policy: QueuePolicy,
    now: Date,
    requestId: string,
    command: QueueCommand,
  ): Promise<QueueSnapshot>;
}
export const QUEUE_REPOSITORY = Symbol('QUEUE_REPOSITORY');
