import type {
  PatientQueueStatus,
  QueueEnqueueResult,
  QueueEntryPage,
  QueueEntryProjection,
  QueueSnapshot,
} from '../domain/queue';

export function mapStaffQueueEntry(entry: QueueEntryProjection) {
  return Object.freeze({
    entryId: entry.id,
    queueSessionId: entry.queueSessionId,
    appointmentId: entry.appointmentId,
    patientProfileId: entry.patientProfileId,
    patientDisplayName: entry.patientName,
    ticketNumber: entry.ticketNumber,
    status: entry.status,
    enqueuedAt: entry.enqueuedAt,
    calledAt: entry.calledAt,
    consultationStartedAt: entry.consultationStartedAt,
    completedAt: entry.completedAt,
    noResponseAt: entry.noResponseAt,
    version: entry.version,
  });
}

export function mapStaffQueue(snapshot: QueueSnapshot) {
  return Object.freeze({
    id: snapshot.id,
    status: snapshot.status,
    version: snapshot.version,
    waitingCount: snapshot.waitingCount,
    currentPatient: snapshot.current
      ? mapStaffQueueEntry(snapshot.current)
      : null,
    updatedAt: snapshot.updatedAt,
  });
}

export function mapQueueEntries(page: QueueEntryPage) {
  return Object.freeze({
    items: Object.freeze(page.items.map(mapStaffQueueEntry)),
    nextCursor: page.nextCursor,
  });
}

export function mapEnqueueResult(result: QueueEnqueueResult) {
  return Object.freeze({
    entry: mapStaffQueueEntry(result.enqueuedEntry),
    queue: mapStaffQueue(result),
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
