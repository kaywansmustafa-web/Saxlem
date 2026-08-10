enum QueueState { notStarted, open, paused, closed }

enum QueueHealth { healthy, busy, delayed }

enum PatientEntryStatus {
  notEnqueued,
  waiting,
  called,
  noResponse,
  inConsultation,
  completed,
  removed,
}

class QueueReference {
  const QueueReference(this.id, this.name);
  final String id, name;
}

class EstimatedWait {
  const EstimatedWait(this.minimumMinutes, this.maximumMinutes);
  final int minimumMinutes, maximumMinutes;
}

class PatientQueueStatus {
  const PatientQueueStatus({
    required this.appointmentId,
    required this.queueState,
    required this.patientsAhead,
    required this.instruction,
    required this.estimateSuspended,
    required this.doctor,
    required this.clinic,
    required this.appointmentReference,
    required this.patientEntryStatus,
    required this.updatedAt,
    this.ticketNumber,
    this.currentTicketNumber,
    this.queueHealth,
    this.estimatedWait,
  });
  final String appointmentId, appointmentReference, instruction;
  final QueueState queueState;
  final int? ticketNumber, currentTicketNumber;
  final int patientsAhead;
  final QueueHealth? queueHealth;
  final EstimatedWait? estimatedWait;
  final bool estimateSuspended;
  final QueueReference doctor, clinic;
  final PatientEntryStatus patientEntryStatus;
  final DateTime updatedAt;
}
