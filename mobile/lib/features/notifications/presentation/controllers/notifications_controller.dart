import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../domain/entities/notification_page.dart';
import '../../domain/entities/notification_snapshot.dart';
import '../../domain/entities/patient_notification.dart';
import '../../domain/repositories/authoritative_notifications_repository.dart';
import '../../domain/repositories/notifications_repository.dart';
import '../../domain/services/notification_grouping_service.dart';
import '../../domain/services/notification_sorting_service.dart';
import '../state/notifications_state.dart';
import '../../../../core/models/patient_profile.dart';

enum NotificationConnectionState {
  disconnected,
  connecting,
  connected,
  reconnecting,
  pausedByLifecycle,
  failed,
}

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
  final _signals = StreamController<NotificationSignal>.broadcast();
  StreamSubscription<NotificationSignal>? _stream;
  List<PatientNotification> _items = [];
  String? _nextCursor, _lastEventId;
  int _generation = 0;
  bool _disposed = false, _loadingMore = false;
  bool _terminalStreamFailure = false;
  NotificationConnectionState connectionState =
      NotificationConnectionState.disconnected;
  NotificationsState state = const NotificationsLoading();
  PatientProfileId profileId = PatientProfileId.me;
  Stream<NotificationSignal> get signals => _signals.stream;
  int get unreadCount => state is NotificationsReady
      ? (state as NotificationsReady).unreadCount
      : 0;
  AuthoritativeNotificationsRepository? get _authoritative =>
      _repository is AuthoritativeNotificationsRepository
      ? _repository as AuthoritativeNotificationsRepository
      : null;
  Future<void> load([PatientProfileId? selected]) async {
    if (selected != null) profileId = selected;
    final authoritative = _authoritative;
    if (authoritative == null) {
      try {
        _setLegacy(await _repository.load(profileId));
      } catch (e) {
        _setFailure(e);
      }
      return;
    }
    final generation = ++_generation;
    state = const NotificationsLoading();
    notifyListeners();
    try {
      final page = await authoritative.list();
      if (generation != _generation) return;
      _items = page.items;
      _nextCursor = page.nextCursor;
      _publish();
      await connect();
    } on NotificationFailure catch (e) {
      if (generation == _generation) _setFailure(e.problem);
    }
  }

  Future<void> loadMore() async {
    final repo = _authoritative, cursor = _nextCursor;
    if (repo == null || cursor == null || _loadingMore) return;
    _loadingMore = true;
    _publish();
    try {
      final page = await repo.list(cursor: cursor);
      final ids = _items.map((e) => e.id).toSet();
      _items = [..._items, ...page.items.where((e) => ids.add(e.id))];
      _nextCursor = page.nextCursor;
      _loadingMore = false;
      _publish();
    } catch (e) {
      _loadingMore = false;
      _publish(loadMoreProblem: e);
    }
  }

  Future<void> markRead(NotificationId id) async {
    final repo = _authoritative;
    if (repo == null) {
      await _repository.markRead(id);
      return;
    }
    final updated = await repo.markNotificationRead(id);
    _items = _items
        .map((e) => e.id == id ? updated : e)
        .toList(growable: false);
    _publish();
  }

  Future<void> open(PatientNotification notification) async {
    if (notification.isUnread) await markRead(notification.id);
  }

  void perform(NotificationAction action) => onAction?.call(action);
  Future<void> connect() async {
    final repo = _authoritative;
    if (repo == null ||
        _stream != null ||
        _disposed ||
        _terminalStreamFailure) {
      return;
    }
    connectionState = _lastEventId == null
        ? NotificationConnectionState.connecting
        : NotificationConnectionState.reconnecting;
    notifyListeners();
    _stream = repo
        .stream(lastEventId: _lastEventId)
        .listen(
          (signal) {
            _lastEventId = signal.deliverySequence;
            _signals.add(signal);
            connectionState = NotificationConnectionState.connected;
            notifyListeners();
            _coalescedReload();
          },
          onError: (Object error) {
            _stream = null;
            _signals.addError(error);
            if (error is NotificationFailure &&
                (error.problem == NotificationProblem.sessionExpired ||
                    error.problem == NotificationProblem.forbidden)) {
              _terminalStreamFailure = true;
              _reconnectTimer?.cancel();
              _items = [];
              _nextCursor = null;
              _lastEventId = null;
              connectionState = NotificationConnectionState.failed;
              _setFailure(error.problem);
            } else {
              connectionState = NotificationConnectionState.failed;
              notifyListeners();
              _scheduleReconnect();
            }
          },
          onDone: () {
            _stream = null;
            if (!_disposed && !_terminalStreamFailure) {
              connectionState = NotificationConnectionState.disconnected;
              notifyListeners();
              _scheduleReconnect();
            }
          },
          cancelOnError: true,
        );
  }

  Timer? _reloadTimer;
  Timer? _reconnectTimer;
  void _scheduleReconnect() {
    if (_disposed || _terminalStreamFailure) return;
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(const Duration(seconds: 5), connect);
  }

  void _coalescedReload() {
    _reloadTimer?.cancel();
    _reloadTimer = Timer(const Duration(milliseconds: 300), () {
      if (!_disposed) load(profileId);
    });
  }

  Future<void> pause() async {
    _reloadTimer?.cancel();
    _reconnectTimer?.cancel();
    await _stream?.cancel();
    _stream = null;
    await _authoritative?.closeStream();
    connectionState = NotificationConnectionState.pausedByLifecycle;
    if (!_disposed) notifyListeners();
  }

  Future<void> resume() async {
    if (_disposed) return;
    await load(profileId);
  }

  void clear() {
    _generation++;
    _reloadTimer?.cancel();
    _reconnectTimer?.cancel();
    _stream?.cancel();
    _stream = null;
    _items = [];
    _nextCursor = null;
    _lastEventId = null;
    _terminalStreamFailure = true;
    state = const NotificationsLoading();
    connectionState = NotificationConnectionState.disconnected;
    if (!_disposed) notifyListeners();
  }

  void _setLegacy(NotificationSnapshot snapshot) {
    _items = snapshot.notifications;
    _nextCursor = null;
    _publish();
  }

  void _publish({Object? loadMoreProblem}) {
    state = NotificationsReady(
      snapshot: NotificationSnapshot(notifications: _items),
      groups: _group(_sort(_items)),
      loadingMore: _loadingMore,
      canLoadMore: _nextCursor != null,
      loadMoreProblem: loadMoreProblem,
    );
    if (!_disposed) notifyListeners();
  }

  void _setFailure(Object problem) {
    state = NotificationsFailure(problem);
    if (!_disposed) notifyListeners();
  }

  @override
  void dispose() {
    _disposed = true;
    _generation++;
    _reloadTimer?.cancel();
    _reconnectTimer?.cancel();
    _stream?.cancel();
    _repository.dispose();
    _signals.close();
    super.dispose();
  }
}
