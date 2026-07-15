import 'patient_notification.dart';

class NotificationSnapshot {
  NotificationSnapshot({required Iterable<PatientNotification> notifications})
    : notifications = List.unmodifiable(notifications);
  final List<PatientNotification> notifications;
  int get unreadCount => notifications.where((item) => item.isUnread).length;
}

class NotificationGroup {
  NotificationGroup(this.key, Iterable<PatientNotification> notifications)
    : notifications = List.unmodifiable(notifications);
  final String? key;
  final List<PatientNotification> notifications;
  PatientNotification get latest => notifications.first;
  int get unreadCount => notifications.where((item) => item.isUnread).length;
  bool get isGrouped => key != null && notifications.length > 1;
}
