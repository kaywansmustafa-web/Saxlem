import 'dart:async';
import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/core/models/patient_profile.dart';
import 'package:saxlem_app/features/notifications/domain/entities/notification_page.dart';
import 'package:saxlem_app/features/notifications/domain/entities/notification_snapshot.dart';
import 'package:saxlem_app/features/notifications/domain/entities/notification_types.dart';
import 'package:saxlem_app/features/notifications/domain/entities/patient_notification.dart';
import 'package:saxlem_app/features/notifications/domain/repositories/authoritative_notifications_repository.dart';
import 'package:saxlem_app/features/notifications/domain/repositories/notifications_repository.dart';
import 'package:saxlem_app/features/notifications/presentation/controllers/notifications_controller.dart';
import 'package:saxlem_app/features/notifications/presentation/state/notifications_state.dart';

void main() {
  test('loads, paginates with deduplication, and marks read', () async {
    final repo = _Repository();
    final controller = NotificationsController(repo);
    await controller.load();
    expect(controller.unreadCount, 1);
    await controller.loadMore();
    final ready = controller.state as NotificationsReady;
    expect(ready.snapshot.notifications.length, 2);
    await controller.markRead(const NotificationId(_first));
    expect(controller.unreadCount, 1);
    expect(
      (controller.state as NotificationsReady)
          .snapshot
          .notifications
          .first
          .isUnread,
      isFalse,
    );
    controller.dispose();
  });
  test(
    'accepted SSE signal advances replay cursor and triggers signal only',
    () async {
      final repo = _Repository();
      final controller = NotificationsController(repo);
      await controller.load();
      final signal = controller.signals.first;
      repo.events.add(
        NotificationSignal(
          deliverySequence: '3',
          notification: _item(_second, '3'),
        ),
      );
      expect((await signal).deliverySequence, '3');
      await controller.pause();
      await controller.resume();
      expect(repo.lastEventIds.last, '3');
      controller.dispose();
    },
  );
  test('terminal stream failure never schedules a reconnect', () async {
    final repo = _Repository();
    final controller = NotificationsController(repo);
    await controller.load();
    expect(repo.streamCalls, 1);

    repo.events.addError(
      const NotificationFailure(NotificationProblem.sessionExpired),
    );
    await Future<void>.delayed(Duration.zero);
    await controller.connect();

    expect(repo.streamCalls, 1);
    expect(controller.connectionState, NotificationConnectionState.failed);
    controller.dispose();
  });
  test('transient stream failure permits one clean reconnect', () async {
    final repo = _Repository();
    final controller = NotificationsController(repo);
    await controller.load();

    repo.events.addError(
      const NotificationFailure(NotificationProblem.offline),
    );
    await Future<void>.delayed(Duration.zero);
    await controller.connect();

    expect(repo.streamCalls, 2);
    controller.dispose();
  });
}

const _first = '11111111-1111-4111-8111-111111111111',
    _second = '22222222-2222-4222-8222-222222222222';
PatientNotification _item(String id, String sequence, {bool read = false}) =>
    PatientNotification(
      id: NotificationId(id),
      type: PatientNotificationType.queueOpened,
      category: NotificationCategory.queue,
      priority: NotificationPriority.high,
      readState: read
          ? NotificationReadState.read
          : NotificationReadState.unread,
      occurredAt: DateTime.parse('2026-08-10T06:00:00Z'),
      receivedAt: DateTime.parse('2026-08-10T06:00:01Z'),
      payload: const NotificationPayload(),
      profileId: null,
      deliverySequence: sequence,
      actionCode: 'queue.session.opened',
    );

class _Repository
    implements NotificationsRepository, AuthoritativeNotificationsRepository {
  final events = StreamController<NotificationSignal>.broadcast();
  final lastEventIds = <String?>[];
  int pages = 0;
  int streamCalls = 0;
  @override
  Future<NotificationPage> list({String? cursor, int pageSize = 25}) async {
    pages++;
    return cursor == null
        ? NotificationPage(items: [_item(_first, '2')], nextCursor: 'cursor')
        : NotificationPage(items: [_item(_first, '2'), _item(_second, '1')]);
  }

  @override
  Future<PatientNotification> markNotificationRead(NotificationId id) async =>
      _item(id.value, '2', read: true);
  @override
  Stream<NotificationSignal> stream({String? lastEventId}) {
    streamCalls++;
    lastEventIds.add(lastEventId);
    return events.stream;
  }

  @override
  Future<void> closeStream() async {}
  @override
  Future<void> dispose() async {
    await events.close();
  }

  @override
  Future<NotificationSnapshot> load([
    PatientProfileId profileId = PatientProfileId.me,
  ]) async => NotificationSnapshot(notifications: []);
  @override
  Stream<NotificationSnapshot> watch([
    PatientProfileId profileId = PatientProfileId.me,
  ]) => const Stream.empty();
  @override
  Future<PatientNotification?> get(NotificationId id) async => null;
  @override
  Future<void> markRead(NotificationId id) async {}
}
