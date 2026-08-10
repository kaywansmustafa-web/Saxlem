import '../entities/notification_snapshot.dart';
import '../entities/patient_notification.dart';
import '../repositories/notifications_repository.dart';

class LoadNotifications {
  const LoadNotifications(this.repository);
  final NotificationsRepository repository;
  Future<NotificationSnapshot> call() => repository.load();
}

class WatchNotifications {
  const WatchNotifications(this.repository);
  final NotificationsRepository repository;
  Stream<NotificationSnapshot> call() => repository.watch();
}

class MarkNotificationRead {
  const MarkNotificationRead(this.repository);
  final NotificationsRepository repository;
  Future<void> call(NotificationId id) => repository.markRead(id);
}
