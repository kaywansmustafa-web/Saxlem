import '../entities/notification_page.dart';
import '../entities/patient_notification.dart';

enum NotificationProblem {
  validation,
  forbidden,
  sessionExpired,
  notFound,
  conflict,
  offline,
  timeout,
  malformed,
  unavailable,
  unknownOutcome,
  unknown,
}

class NotificationFailure implements Exception {
  const NotificationFailure(this.problem);
  final NotificationProblem problem;
}

abstract interface class AuthoritativeNotificationsRepository {
  Future<NotificationPage> list({String? cursor, int pageSize = 25});
  Future<PatientNotification> markNotificationRead(NotificationId id);
  Stream<NotificationSignal> stream({String? lastEventId});
  Future<void> closeStream();
}
