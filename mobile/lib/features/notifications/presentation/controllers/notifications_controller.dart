import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../domain/entities/notification_snapshot.dart';
import '../../domain/entities/patient_notification.dart';
import '../../domain/repositories/notifications_repository.dart';
import '../../domain/services/notification_grouping_service.dart';
import '../../domain/services/notification_sorting_service.dart';
import '../../domain/use_cases/notification_use_cases.dart';
import '../state/notifications_state.dart';
import '../../../../core/models/patient_profile.dart';

class NotificationsController extends ChangeNotifier {
  NotificationsController(
    this._repository, {
    this.onAction,
    this.now = DateTime.now,
  });
  final NotificationsRepository _repository;
  final ValueChanged<NotificationAction>? onAction;
  final DateTime Function() now;
  final _group = const NotificationGroupingService();
  final _sort = const NotificationSortingService();
  StreamSubscription<NotificationSnapshot>? _subscription;
  NotificationsState state = const NotificationsLoading();
  PatientProfileId profileId = PatientProfileId.me;

  int get unreadCount => state is NotificationsReady
      ? (state as NotificationsReady).unreadCount
      : 0;

  Future<void> load([PatientProfileId? selected]) async {
    if (selected != null) profileId = selected;
    await _subscription?.cancel();
    try {
      _set(await _repository.load(profileId));
      _subscription = _repository.watch(profileId).listen(_set);
    } catch (_) {
      state = const NotificationsFailure();
      notifyListeners();
    }
  }

  void _set(NotificationSnapshot snapshot) {
    state = NotificationsReady(
      snapshot: snapshot,
      groups: _group(_sort(snapshot.notifications)),
    );
    notifyListeners();
  }

  Future<void> markRead(NotificationId id) =>
      MarkNotificationRead(_repository)(id);
  Future<void> delete(NotificationId id) => DeleteNotification(_repository)(id);

  Future<void> open(PatientNotification notification) async {
    if (notification.isUnread) await markRead(notification.id);
  }

  void perform(NotificationAction action) => onAction?.call(action);

  @override
  void dispose() {
    _subscription?.cancel();
    _repository.dispose();
    super.dispose();
  }
}
