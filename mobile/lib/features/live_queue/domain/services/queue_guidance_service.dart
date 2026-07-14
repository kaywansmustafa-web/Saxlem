import '../entities/patient_queue_snapshot.dart';
import '../entities/queue_types.dart';

abstract interface class QueueGuidanceService {
  String guidanceFor(PatientQueueSnapshot snapshot);
}

class RuleBasedQueueGuidanceService implements QueueGuidanceService {
  const RuleBasedQueueGuidanceService();

  @override
  String guidanceFor(PatientQueueSnapshot snapshot) {
    if (snapshot.sessionStatus == QueueSessionStatus.paused ||
        snapshot.doctorTimingMinutes >= 15) {
      return "Doctor is delayed. We'll keep you updated.";
    }
    if (snapshot.patientStatus == PatientQueueStatus.called ||
        snapshot.patientsAhead == 0) {
      return 'Please head to reception.';
    }
    if (snapshot.estimatedWaitLowerMinutes <= 15 &&
        snapshot.patientStatus == PatientQueueStatus.expected) {
      return 'Leave in about 10 minutes.';
    }
    return 'Relax, no need to leave yet.';
  }
}
