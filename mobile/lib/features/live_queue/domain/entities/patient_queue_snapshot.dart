import 'queue_types.dart';
import '../../../../core/models/patient_profile.dart';

class PatientQueueSnapshot {
  const PatientQueueSnapshot({
    required this.sessionId,
    required this.queueEntryId,
    required this.queueVersion,
    required this.careProviderDisplayName,
    required this.serviceDisplayName,
    required this.anonymousCurrentToken,
    required this.patientNumber,
    required this.patientsAhead,
    required this.estimatedWaitLowerMinutes,
    required this.estimatedWaitUpperMinutes,
    required this.estimateConfidence,
    required this.doctorTimingMinutes,
    required this.patientStatus,
    required this.sessionStatus,
    required this.lastUpdatedAt,
    required this.remoteWaitingAllowed,
    required this.allowedActions,
    required this.guidanceMessage,
    this.profileId = PatientProfileId.me,
  }) : assert(queueVersion >= 0),
       assert(patientsAhead >= 0),
       assert(estimatedWaitLowerMinutes >= 0),
       assert(estimatedWaitUpperMinutes >= estimatedWaitLowerMinutes);

  final String sessionId;
  final String queueEntryId;
  final int queueVersion;
  final String careProviderDisplayName;
  final String serviceDisplayName;
  final String? anonymousCurrentToken;
  final String patientNumber;
  final int patientsAhead;
  final int estimatedWaitLowerMinutes;
  final int estimatedWaitUpperMinutes;
  final QueueEstimateConfidence estimateConfidence;
  final int doctorTimingMinutes;
  final PatientQueueStatus patientStatus;
  final QueueSessionStatus sessionStatus;
  final DateTime lastUpdatedAt;
  final bool remoteWaitingAllowed;
  final Set<PatientQueueAction> allowedActions;
  final String guidanceMessage;
  final PatientProfileId profileId;

  PatientQueueSnapshot copyWith({
    int? queueVersion,
    String? anonymousCurrentToken,
    String? patientNumber,
    int? patientsAhead,
    int? estimatedWaitLowerMinutes,
    int? estimatedWaitUpperMinutes,
    QueueEstimateConfidence? estimateConfidence,
    int? doctorTimingMinutes,
    PatientQueueStatus? patientStatus,
    QueueSessionStatus? sessionStatus,
    DateTime? lastUpdatedAt,
    bool? remoteWaitingAllowed,
    Set<PatientQueueAction>? allowedActions,
    String? guidanceMessage,
    PatientProfileId? profileId,
  }) => PatientQueueSnapshot(
    sessionId: sessionId,
    queueEntryId: queueEntryId,
    queueVersion: queueVersion ?? this.queueVersion,
    careProviderDisplayName: careProviderDisplayName,
    serviceDisplayName: serviceDisplayName,
    anonymousCurrentToken: anonymousCurrentToken ?? this.anonymousCurrentToken,
    patientNumber: patientNumber ?? this.patientNumber,
    patientsAhead: patientsAhead ?? this.patientsAhead,
    estimatedWaitLowerMinutes:
        estimatedWaitLowerMinutes ?? this.estimatedWaitLowerMinutes,
    estimatedWaitUpperMinutes:
        estimatedWaitUpperMinutes ?? this.estimatedWaitUpperMinutes,
    estimateConfidence: estimateConfidence ?? this.estimateConfidence,
    doctorTimingMinutes: doctorTimingMinutes ?? this.doctorTimingMinutes,
    patientStatus: patientStatus ?? this.patientStatus,
    sessionStatus: sessionStatus ?? this.sessionStatus,
    lastUpdatedAt: lastUpdatedAt ?? this.lastUpdatedAt,
    remoteWaitingAllowed: remoteWaitingAllowed ?? this.remoteWaitingAllowed,
    allowedActions: allowedActions ?? this.allowedActions,
    guidanceMessage: guidanceMessage ?? this.guidanceMessage,
    profileId: profileId ?? this.profileId,
  );
}
