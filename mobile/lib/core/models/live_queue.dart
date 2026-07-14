class LiveQueue {
  const LiveQueue({
    required this.doctorName,
    required this.specialty,
    required this.currentPatientNumber,
    required this.patientNumber,
    required this.patientsAhead,
    required this.estimatedWaitMinutes,
    required this.doctorDelayMinutes,
  });

  final String doctorName;
  final String specialty;
  final int currentPatientNumber;
  final int patientNumber;
  final int patientsAhead;
  final int estimatedWaitMinutes;
  final int doctorDelayMinutes;
}
