import '../domain/entities/queue_types.dart';

class LiveQueueCopy {
  const LiveQueueCopy({
    required this.pageTitle,
    required this.currentPatient,
    required this.yourNumber,
    required this.patientsAhead,
    required this.estimatedWait,
    required this.estimateConfidence,
    required this.doctorStatus,
    required this.onMyWay,
    required this.arrived,
    required this.runningLate,
    required this.cancel,
    required this.requestHelp,
    required this.retry,
    required this.veryAccurate,
    required this.reliable,
    required this.lessCertain,
    required this.doctorStatusFor,
    required this.relativeUpdateFor,
    required this.waitRangeFor,
  });

  final String pageTitle;
  final String currentPatient;
  final String yourNumber;
  final String patientsAhead;
  final String estimatedWait;
  final String estimateConfidence;
  final String doctorStatus;
  final String onMyWay;
  final String arrived;
  final String runningLate;
  final String cancel;
  final String requestHelp;
  final String retry;
  final String veryAccurate;
  final String reliable;
  final String lessCertain;
  final String Function(int minutes) doctorStatusFor;
  final String Function(DateTime updatedAt, DateTime now) relativeUpdateFor;
  final String Function(int lowerMinutes, int upperMinutes) waitRangeFor;

  String confidenceLabel(QueueEstimateConfidence confidence) =>
      switch (confidence) {
        QueueEstimateConfidence.high => veryAccurate,
        QueueEstimateConfidence.medium => reliable,
        QueueEstimateConfidence.low => lessCertain,
      };
}
