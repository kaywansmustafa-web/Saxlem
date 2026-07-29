import type {
  PatientQueueStatus,
  QueueEntryPage,
  QueueEntryProjection,
  QueueSnapshot,
} from '../domain/queue';

export function mapQueueEntry(entry: QueueEntryProjection) {
  return Object.freeze({
    appointmentReference: entry.appointmentReference,
    ticketNumber: entry.ticketNumber,
    status: entry.status,
    version: entry.version,
  });
}

export function mapStaffQueue(snapshot: QueueSnapshot) {
  return Object.freeze({
    id: snapshot.id,
    status: snapshot.status,
    version: snapshot.version,
    waitingCount: snapshot.waitingCount,
    currentPatient: snapshot.current ? mapQueueEntry(snapshot.current) : null,
    updatedAt: snapshot.updatedAt,
  });
}

export function mapQueueEntries(page: QueueEntryPage) {
  return Object.freeze({
    items: Object.freeze(page.items.map(mapQueueEntry)),
    nextCursor: page.nextCursor,
  });
}

export function mapPatientQueue(status: PatientQueueStatus) {
  return Object.freeze({
    queueState: status.queueState,
    ticketNumber: status.ticketNumber,
    currentTicket: status.currentTicket,
    patientsAhead: status.patientsAhead,
    estimatedWait: status.estimatedWait,
    estimateSuspended: status.estimateSuspended,
    queueHealth: status.queueHealth,
    doctor: status.doctor,
    clinic: status.clinic,
    appointmentReference: status.appointmentReference,
    status: status.status,
    instruction: status.instruction,
    lastUpdatedAt: status.lastUpdatedAt,
  });
}
