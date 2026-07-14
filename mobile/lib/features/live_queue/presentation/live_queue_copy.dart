import '../domain/entities/queue_types.dart';

class LiveQueueCopy {
  const LiveQueueCopy({
    this.pageTitle = 'Live Queue',
    this.currentPatient = 'Now serving',
    this.yourNumber = 'Your Number',
    this.patientsAhead = 'Patients ahead',
    this.estimatedWait = 'Estimated wait',
    this.estimateConfidence = 'Estimate confidence',
    this.doctorStatus = 'Doctor status',
    this.onMyWay = "I'm on my way",
    this.arrived = "I've arrived",
    this.runningLate = "I'm running late",
    this.cancel = 'Cancel appointment',
    this.requestHelp = 'Request help',
    this.retry = 'Try again',
    this.veryAccurate = 'Very Accurate',
    this.reliable = 'Reliable',
    this.lessCertain = 'Less Certain',
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

  String confidenceLabel(QueueEstimateConfidence confidence) =>
      switch (confidence) {
        QueueEstimateConfidence.high => veryAccurate,
        QueueEstimateConfidence.medium => reliable,
        QueueEstimateConfidence.low => lessCertain,
      };

  String doctorStatusFor(int minutes) {
    if (minutes.abs() <= 2) return 'Running on time';
    if (minutes > 0) return 'Running $minutes minutes late';
    return 'Running ${minutes.abs()} minutes early';
  }

  String relativeUpdateFor(DateTime updatedAt, DateTime now) {
    final minutes = now.difference(updatedAt).inMinutes;
    if (minutes <= 0) return 'Updated just now';
    if (minutes == 1) return 'Updated 1 minute ago';
    return 'Updated $minutes minutes ago';
  }
}
