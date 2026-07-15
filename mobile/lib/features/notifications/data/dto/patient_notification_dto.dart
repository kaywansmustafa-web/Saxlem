class PatientNotificationDto {
  const PatientNotificationDto({
    required this.id,
    required this.type,
    required this.priority,
    required this.occurredAt,
    this.groupKey,
    this.doctorName,
    this.clinicName,
    this.minutes,
    this.queueNumber,
    this.message,
    this.targetId,
    this.profileId = 'me',
  });
  final String id, type, priority, occurredAt;
  final String? groupKey, doctorName, clinicName, message, targetId;
  final String? profileId;
  final int? minutes, queueNumber;
}
