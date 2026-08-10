import '../../domain/entities/notification_snapshot.dart';

sealed class NotificationsState {
  const NotificationsState();
}

class NotificationsLoading extends NotificationsState {
  const NotificationsLoading();
}

class NotificationsFailure extends NotificationsState {
  const NotificationsFailure([this.problem]);
  final Object? problem;
}

class NotificationsReady extends NotificationsState {
  const NotificationsReady({
    required this.snapshot,
    required this.groups,
    this.loadingMore = false,
    this.canLoadMore = false,
    this.loadMoreProblem,
  });
  final NotificationSnapshot snapshot;
  final List<NotificationGroup> groups;
  final bool loadingMore, canLoadMore;
  final Object? loadMoreProblem;
  int get unreadCount => snapshot.unreadCount;
}
