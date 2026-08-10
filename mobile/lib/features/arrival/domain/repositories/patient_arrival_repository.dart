import '../entities/patient_arrival.dart';

enum ArrivalProblem {
  validation,
  ineligible,
  forbidden,
  sessionExpired,
  notFound,
  conflict,
  offline,
  timeout,
  malformed,
  unavailable,
  unknownOutcome,
  unknown,
}

class ArrivalFailure implements Exception {
  const ArrivalFailure(this.problem);
  final ArrivalProblem problem;
}

abstract interface class PatientArrivalRepository {
  Future<PatientArrival> getArrival(String appointmentId);
  Future<PatientArrival> recordArrival(
    String appointmentId,
    int expectedVersion,
    String operationId,
  );
}
