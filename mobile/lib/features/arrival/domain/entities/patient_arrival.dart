enum ArrivalStatus { expected, arrived, queueReady }

enum ArrivalEligibilityReason {
  eligible,
  tooEarly,
  tooLate,
  invalidAppointmentStatus,
  alreadyArrived,
  queueReady,
  unavailable,
}

class ArrivalEligibility {
  const ArrivalEligibility({
    required this.canArrive,
    required this.reason,
    this.opensAt,
    this.closesAt,
  });
  final bool canArrive;
  final ArrivalEligibilityReason reason;
  final DateTime? opensAt;
  final DateTime? closesAt;
}

class PatientArrival {
  const PatientArrival({
    required this.id,
    required this.appointmentId,
    required this.appointmentReference,
    required this.clinicId,
    required this.clinicName,
    required this.doctorId,
    required this.doctorName,
    required this.patientProfileId,
    required this.patientName,
    required this.appointmentStartsAt,
    required this.status,
    required this.version,
    required this.eligibility,
    this.arrivedAt,
    this.queueReadyAt,
  });
  final String id, appointmentId, appointmentReference;
  final String clinicId, clinicName, doctorId, doctorName;
  final String patientProfileId, patientName;
  final DateTime appointmentStartsAt;
  final ArrivalStatus status;
  final DateTime? arrivedAt, queueReadyAt;
  final int version;
  final ArrivalEligibility eligibility;
}
