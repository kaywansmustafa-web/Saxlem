import '../entities/patient_queue_status.dart';

enum LiveQueueProblem {
  validation,
  forbidden,
  sessionExpired,
  notFound,
  offline,
  timeout,
  malformed,
  unavailable,
  unknown,
}

class LiveQueueFailure implements Exception {
  const LiveQueueFailure(this.problem);
  final LiveQueueProblem problem;
}

abstract interface class LiveQueueRepository {
  Future<PatientQueueStatus> getQueueStatus(String appointmentId);
}
