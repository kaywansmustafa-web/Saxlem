import '../dto/patient_notification_dto.dart';

class MockNotificationsDataSource {
  MockNotificationsDataSource({DateTime Function()? now})
    : _now = now ?? DateTime.now;
  final DateTime Function() _now;

  Future<List<PatientNotificationDto>> load() async {
    final now = _now().toUtc();
    return [
      PatientNotificationDto(
        id: 'queue-almost-turn',
        type: 'almostYourTurn',
        priority: 'high',
        occurredAt: now.subtract(const Duration(minutes: 2)).toIso8601String(),
        groupKey: 'queue:demo-today',
        doctorName: 'Dr. Sara Ahmed',
        queueNumber: 12,
        targetId: 'demo-today',
      ),
      PatientNotificationDto(
        id: 'queue-open',
        type: 'queueOpened',
        priority: 'normal',
        occurredAt: now.subtract(const Duration(minutes: 18)).toIso8601String(),
        groupKey: 'queue:demo-today',
        doctorName: 'Dr. Sara Ahmed',
        targetId: 'demo-today',
      ),
      PatientNotificationDto(
        id: 'booking-confirmed',
        type: 'bookingConfirmed',
        priority: 'normal',
        occurredAt: now.subtract(const Duration(hours: 3)).toIso8601String(),
        doctorName: 'Dr. Dilan Hassan',
        clinicName: 'Saxlem Medical Center',
        targetId: 'APT-2026-1042',
      ),
      PatientNotificationDto(
        id: 'welcome',
        type: 'accountWelcome',
        priority: 'informational',
        occurredAt: now.subtract(const Duration(days: 2)).toIso8601String(),
      ),
    ];
  }
}
