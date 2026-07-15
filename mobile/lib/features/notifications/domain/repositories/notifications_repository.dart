import '../entities/notification_snapshot.dart';
import '../entities/patient_notification.dart';

abstract interface class NotificationsRepository {
  Future<NotificationSnapshot> load();
  Stream<NotificationSnapshot> watch();
  Future<PatientNotification?> get(NotificationId id);
  Future<void> markRead(NotificationId id);
  Future<void> delete(NotificationId id);
  Future<void> dispose();
}
