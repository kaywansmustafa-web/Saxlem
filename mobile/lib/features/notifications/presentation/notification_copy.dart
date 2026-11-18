import '../../../core/formatting/clinic_format.dart';
import '../../../l10n/app_localizations.dart';
import '../domain/entities/notification_types.dart';
import '../domain/entities/patient_notification.dart';

/// What a notification says: a clear title, what happened (with the doctor,
/// clinic, time or ticket when the backend sent them), why, and what to do.
class NotificationCopy {
  const NotificationCopy(this.strings);
  final AppLocalizations strings;

  ({String title, String happened, String why, String next}) forItem(
    PatientNotification item,
  ) {
    final p = item.payload;
    final doctor = p.doctorName ?? '';
    final whyVisit = strings.ntfWhyAppointment, whyQueue = strings.ntfWhyQueue;
    ({String title, String happened, String why, String next}) visit(
      String title,
      String next,
    ) => (title: title, happened: _visit(p), why: whyVisit, next: next);
    ({String title, String happened, String why, String next}) queue(
      String title,
      String happened,
      String next,
    ) => (title: title, happened: happened, why: whyQueue, next: next);

    return switch (item.type) {
      PatientNotificationType.bookingConfirmed => visit(
        strings.ntfBookedTitle,
        strings.ntfBookedNext,
      ),
      PatientNotificationType.appointmentReminder24Hours => visit(
        strings.ntfReminderDayTitle,
        strings.ntfReminderNext,
      ),
      PatientNotificationType.appointmentReminder2Hours => visit(
        strings.ntfReminderSoonTitle,
        strings.ntfReminderNext,
      ),
      PatientNotificationType.appointmentCancelled => visit(
        strings.ntfCancelledTitle,
        strings.ntfCancelledNext,
      ),
      PatientNotificationType.appointmentRescheduled => visit(
        strings.ntfRescheduledTitle,
        strings.ntfRescheduledNext,
      ),
      PatientNotificationType.almostYourTurn => queue(
        p.ahead == 0 ? strings.ntfNextTitle : strings.ntfAlmostTitle,
        _join([
          if (p.queueNumber != null) strings.ntfTicket(p.queueNumber!),
          if (p.ahead != null) strings.ntfAhead(p.ahead!),
          if (p.ahead == null) doctor,
        ]),
        strings.ntfAlmostNext,
      ),
      PatientNotificationType.queueOpened => queue(
        strings.ntfQueueOpenedTitle,
        doctor.isEmpty ? '' : strings.ntfDoctorStarted(doctor),
        strings.ntfFollowQueue,
      ),
      PatientNotificationType.queuePaused => queue(
        strings.ntfPausedTitle,
        doctor.isEmpty ? '' : strings.ntfDoctorPaused(doctor),
        strings.ntfPausedNext,
      ),
      PatientNotificationType.queueResumed => queue(
        strings.ntfResumedTitle,
        doctor.isEmpty ? '' : strings.ntfDoctorResumed(doctor),
        strings.ntfFollowQueue,
      ),
      PatientNotificationType.queueClosed => queue(
        strings.ntfClosedTitle,
        doctor.isEmpty ? '' : strings.ntfDoctorFinished(doctor),
        strings.ntfClosedNext,
      ),
      PatientNotificationType.queueNumberUpdated => queue(
        strings.ntfEnqueuedTitle,
        _ticketAndDoctor(p),
        strings.ntfFollowQueue,
      ),
      PatientNotificationType.calledIn => queue(
        strings.ntfCalledTitle,
        _ticketAndDoctor(p),
        strings.ntfCalledNext,
      ),
      PatientNotificationType.missedTurn => queue(
        strings.ntfMissedTitle,
        _ticketAndDoctor(p),
        strings.ntfMissedNext,
      ),
      PatientNotificationType.consultationStarted => queue(
        strings.ntfStartedTitle,
        _ticketAndDoctor(p),
        '',
      ),
      PatientNotificationType.visitCompleted => queue(
        strings.ntfCompletedTitle,
        doctor.isEmpty ? '' : strings.ntfCompletedHappened(doctor),
        strings.ntfCompletedNext,
      ),
      PatientNotificationType.accountWelcome => (
        title: strings.notificationWelcome,
        happened: strings.notificationWelcomeHappened,
        why: strings.notificationWelcomeWhy,
        next: strings.notificationWelcomeNext,
      ),
      _ => (
        title: item.isQueue ? strings.queueUpdates : strings.notifications,
        happened: strings.notificationGeneralHappened,
        why: strings.notificationGeneralWhy,
        next: strings.notificationGeneralNext,
      ),
    };
  }

  /// "Dr. Shilan at Riverside Clinic · Thursday, 19 Nov 2026 · 10:30".
  String _visit(NotificationPayload p) {
    final lang = strings.localeName;
    final who = p.doctorName == null
        ? ''
        : p.clinicName == null
        ? p.doctorName!
        : strings.ntfAtClinic(p.doctorName!, p.clinicName!);
    final when = p.startsAt == null
        ? ''
        : '${ClinicFormat.weekdayDay(ClinicFormat.atClinic(p.startsAt!), lang)}'
              ' · ${ClinicFormat.time(p.startsAt!)}';
    final line = _join([who, when]);
    return line.isEmpty ? strings.notificationGeneralHappened : line;
  }

  String _ticketAndDoctor(NotificationPayload p) => _join([
    if (p.queueNumber != null) strings.ntfTicket(p.queueNumber!),
    p.doctorName ?? '',
  ]);

  static String _join(List<String> parts) =>
      parts.where((part) => part.trim().isNotEmpty).join(' · ');
}
