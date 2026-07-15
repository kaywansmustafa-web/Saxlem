import '../entities/notification_snapshot.dart';
import '../entities/patient_notification.dart';

class NotificationGroupingService {
  const NotificationGroupingService();

  List<NotificationGroup> call(Iterable<PatientNotification> input) {
    final groups = <String, List<PatientNotification>>{};
    final result = <NotificationGroup>[];
    for (final item in input) {
      final key = item.isQueue ? item.groupKey : null;
      if (key == null) {
        result.add(NotificationGroup(null, [item]));
      } else {
        groups.putIfAbsent(key, () => []).add(item);
      }
    }
    result.addAll(groups.entries.map((e) => NotificationGroup(e.key, e.value)));
    result.sort((a, b) => b.latest.occurredAt.compareTo(a.latest.occurredAt));
    return List.unmodifiable(result);
  }
}
