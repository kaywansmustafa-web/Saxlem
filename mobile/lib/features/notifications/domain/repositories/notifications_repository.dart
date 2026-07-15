import '../entities/notification_snapshot.dart';
import '../entities/patient_notification.dart';
import '../../../../core/models/patient_profile.dart';

abstract interface class NotificationsRepository {
  Future<NotificationSnapshot> load([
    PatientProfileId profileId = PatientProfileId.me,
  ]);
  Stream<NotificationSnapshot> watch([
    PatientProfileId profileId = PatientProfileId.me,
  ]);
  Future<PatientNotification?> get(NotificationId id);
  Future<void> markRead(NotificationId id);
  Future<void> delete(NotificationId id);
  Future<void> dispose();
}
