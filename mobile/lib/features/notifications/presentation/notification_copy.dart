import '../../../l10n/app_localizations.dart';
import '../domain/entities/notification_types.dart';
import '../domain/entities/patient_notification.dart';

class NotificationCopy {
  const NotificationCopy(this.strings);
  final AppLocalizations strings;

  ({String title, String happened, String why, String next}) forItem(
    PatientNotification item,
  ) => switch (item.type) {
    PatientNotificationType.bookingConfirmed => (
      title: strings.notificationBookingConfirmed,
      happened: strings.notificationBookingHappened(
        item.payload.doctorName ?? '',
      ),
      why: strings.notificationBookingWhy,
      next: strings.notificationBookingNext,
    ),
    PatientNotificationType.queueOpened => (
      title: strings.notificationQueueOpened,
      happened: strings.notificationQueueOpenedHappened(
        item.payload.doctorName ?? '',
      ),
      why: strings.notificationQueueOpenedWhy,
      next: strings.notificationQueueOpenedNext,
    ),
    PatientNotificationType.almostYourTurn => (
      title: strings.notificationAlmostTurn,
      happened: strings.notificationAlmostTurnHappened(
        item.payload.queueNumber ?? 0,
      ),
      why: strings.notificationAlmostTurnWhy,
      next: strings.notificationAlmostTurnNext,
    ),
    PatientNotificationType.accountWelcome => (
      title: strings.notificationWelcome,
      happened: strings.notificationWelcomeHappened,
      why: strings.notificationWelcomeWhy,
      next: strings.notificationWelcomeNext,
    ),
    PatientNotificationType.appointmentCheckedIn => (
      title: strings.notificationReservedType,
      happened: strings.notificationReservedHappened,
      why: strings.notificationReservedWhy,
      next: strings.notificationReservedNext,
    ),
    _ => (
      title: strings.notifications,
      happened: strings.notificationGeneralHappened,
      why: strings.notificationGeneralWhy,
      next: strings.notificationGeneralNext,
    ),
  };
}
