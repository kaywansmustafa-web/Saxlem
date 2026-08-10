import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/features/notifications/data/data_sources/mock_notifications_data_source.dart';
import 'package:saxlem_app/features/notifications/data/mappers/patient_notification_mapper.dart';
import 'package:saxlem_app/features/notifications/data/repositories/in_memory_notifications_repository.dart';
import 'package:saxlem_app/features/notifications/domain/services/notification_grouping_service.dart';

void main() {
  test(
    'groups queue updates only and keeps other records individual',
    () async {
      final repository = InMemoryNotificationsRepository(
        MockNotificationsDataSource(now: () => DateTime.utc(2026, 7, 15, 10)),
        const PatientNotificationMapper(),
      );
      addTearDown(repository.dispose);
      final snapshot = await repository.load();
      final groups = const NotificationGroupingService()(
        snapshot.notifications,
      );
      expect(groups.where((g) => g.isGrouped), hasLength(1));
      expect(
        groups.singleWhere((g) => g.isGrouped).notifications,
        hasLength(2),
      );
      expect(groups.where((g) => !g.latest.isQueue), hasLength(2));
    },
  );

  test('mark read emits an accurate snapshot', () async {
    final repository = InMemoryNotificationsRepository(
      MockNotificationsDataSource(now: () => DateTime.utc(2026, 7, 15, 10)),
      const PatientNotificationMapper(),
    );
    addTearDown(repository.dispose);
    final initial = await repository.load();
    final id = initial.notifications.first.id;
    await repository.markRead(id);
    expect((await repository.get(id))!.isUnread, isFalse);
  });
}
