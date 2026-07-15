import 'notification_types.dart';

class NotificationId {
  const NotificationId(this.value) : assert(value != '');
  final String value;

  @override
  bool operator ==(Object other) =>
      other is NotificationId && other.value == value;
  @override
  int get hashCode => value.hashCode;
}

class NotificationAction {
  const NotificationAction(this.destination, {this.targetId});
  const NotificationAction.none() : this(NotificationDestination.none);
  final NotificationDestination destination;
  final String? targetId;
}

class NotificationPayload {
  const NotificationPayload({
    this.doctorName,
    this.clinicName,
    this.minutes,
    this.queueNumber,
    this.previousQueueNumber,
    this.title,
    this.message,
  });
  final String? doctorName, clinicName, title, message;
  final int? minutes, queueNumber, previousQueueNumber;
}

class PatientNotification {
  const PatientNotification({
    required this.id,
    required this.type,
    required this.category,
    required this.priority,
    required this.readState,
    required this.occurredAt,
    required this.receivedAt,
    required this.payload,
    this.action = const NotificationAction.none(),
    this.groupKey,
  });

  final NotificationId id;
  final PatientNotificationType type;
  final NotificationCategory category;
  final NotificationPriority priority;
  final NotificationReadState readState;
  final DateTime occurredAt, receivedAt;
  final NotificationPayload payload;
  final NotificationAction action;
  final String? groupKey;

  bool get isUnread => readState == NotificationReadState.unread;
  bool get isQueue => category == NotificationCategory.queue;

  PatientNotification markRead() => PatientNotification(
    id: id,
    type: type,
    category: category,
    priority: priority,
    readState: NotificationReadState.read,
    occurredAt: occurredAt,
    receivedAt: receivedAt,
    payload: payload,
    action: action,
    groupKey: groupKey,
  );
}
