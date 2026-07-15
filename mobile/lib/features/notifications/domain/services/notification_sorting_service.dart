import '../entities/patient_notification.dart';

class NotificationSortingService {
  const NotificationSortingService();
  List<PatientNotification> call(Iterable<PatientNotification> input) {
    final result = input.toList();
    result.sort((a, b) {
      final priority = a.priority.index.compareTo(b.priority.index);
      if (priority != 0) return priority;
      final time = b.occurredAt.compareTo(a.occurredAt);
      return time != 0 ? time : a.id.value.compareTo(b.id.value);
    });
    return List.unmodifiable(result);
  }
}
