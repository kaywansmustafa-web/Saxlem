import '../../domain/entities/notification_snapshot.dart';

sealed class NotificationsState {
  const NotificationsState();
}

class NotificationsLoading extends NotificationsState {
  const NotificationsLoading();
}

class NotificationsFailure extends NotificationsState {
  const NotificationsFailure();
}

class NotificationsReady extends NotificationsState {
  const NotificationsReady({required this.snapshot, required this.groups});
  final NotificationSnapshot snapshot;
  final List<NotificationGroup> groups;
  int get unreadCount => snapshot.unreadCount;
}
