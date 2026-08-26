import '../entities/patient_queue_snapshot.dart';
import '../entities/queue_types.dart';

abstract interface class QueueGuidanceService {
  String guidanceFor(PatientQueueSnapshot snapshot);
}

class RuleBasedQueueGuidanceService implements QueueGuidanceService {
  const RuleBasedQueueGuidanceService({
    required this.doctorDelayed,
    required this.headToReception,
    required this.leaveSoon,
    required this.relax,
  });

  final String doctorDelayed;
  final String headToReception;
  final String leaveSoon;
  final String relax;

  @override
  String guidanceFor(PatientQueueSnapshot snapshot) {
    if (snapshot.sessionStatus == QueueSessionStatus.paused ||
        snapshot.doctorTimingMinutes >= 15) {
      return doctorDelayed;
    }
    if (snapshot.patientStatus == PatientQueueStatus.called ||
        snapshot.patientsAhead == 0) {
      return headToReception;
    }
    if (snapshot.estimatedWaitLowerMinutes <= 15 &&
        snapshot.patientStatus == PatientQueueStatus.expected) {
      return leaveSoon;
    }
    return relax;
  }
}
