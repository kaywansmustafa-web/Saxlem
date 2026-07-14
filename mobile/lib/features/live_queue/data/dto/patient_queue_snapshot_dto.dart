class PatientQueueSnapshotDto {
  const PatientQueueSnapshotDto({
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
  });

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
  final String estimateConfidence;
  final int doctorTimingMinutes;
  final String patientStatus;
  final String sessionStatus;
  final String lastUpdatedAt;
  final bool remoteWaitingAllowed;
  final List<String> allowedActions;

  Map<String, Object?> toMap() => {
    'sessionId': sessionId,
    'queueEntryId': queueEntryId,
    'queueVersion': queueVersion,
    'careProviderDisplayName': careProviderDisplayName,
    'serviceDisplayName': serviceDisplayName,
    'anonymousCurrentToken': anonymousCurrentToken,
    'patientNumber': patientNumber,
    'patientsAhead': patientsAhead,
    'estimatedWaitLowerMinutes': estimatedWaitLowerMinutes,
    'estimatedWaitUpperMinutes': estimatedWaitUpperMinutes,
    'estimateConfidence': estimateConfidence,
    'doctorTimingMinutes': doctorTimingMinutes,
    'patientStatus': patientStatus,
    'sessionStatus': sessionStatus,
    'lastUpdatedAt': lastUpdatedAt,
    'remoteWaitingAllowed': remoteWaitingAllowed,
    'allowedActions': allowedActions,
  };

  factory PatientQueueSnapshotDto.fromMap(Map<String, Object?> map) =>
      PatientQueueSnapshotDto(
        sessionId: map['sessionId']! as String,
        queueEntryId: map['queueEntryId']! as String,
        queueVersion: map['queueVersion']! as int,
        careProviderDisplayName: map['careProviderDisplayName']! as String,
        serviceDisplayName: map['serviceDisplayName']! as String,
        anonymousCurrentToken: map['anonymousCurrentToken'] as String?,
        patientNumber: map['patientNumber']! as String,
        patientsAhead: map['patientsAhead']! as int,
        estimatedWaitLowerMinutes: map['estimatedWaitLowerMinutes']! as int,
        estimatedWaitUpperMinutes: map['estimatedWaitUpperMinutes']! as int,
        estimateConfidence: map['estimateConfidence']! as String,
        doctorTimingMinutes: map['doctorTimingMinutes']! as int,
        patientStatus: map['patientStatus']! as String,
        sessionStatus: map['sessionStatus']! as String,
        lastUpdatedAt: map['lastUpdatedAt']! as String,
        remoteWaitingAllowed: map['remoteWaitingAllowed']! as bool,
        allowedActions: List<String>.from(map['allowedActions']! as List),
      );
}
