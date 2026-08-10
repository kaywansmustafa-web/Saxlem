import 'patient_notification.dart';

class NotificationPage {
  NotificationPage({
    required Iterable<PatientNotification> items,
    this.nextCursor,
  }) : items = List.unmodifiable(items);
  final List<PatientNotification> items;
  final String? nextCursor;
}

class NotificationSignal {
  const NotificationSignal({
    required this.deliverySequence,
    required this.notification,
  });
  final String deliverySequence;
  final PatientNotification notification;
}
