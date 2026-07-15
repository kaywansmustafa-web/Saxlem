import '../../domain/entities/notification_types.dart';
import '../../domain/entities/patient_notification.dart';
import '../dto/patient_notification_dto.dart';
import '../../../../core/models/patient_profile.dart';

class PatientNotificationMapper {
  const PatientNotificationMapper();
  PatientNotification map(PatientNotificationDto dto) {
    final type = PatientNotificationType.values.byName(dto.type);
    return PatientNotification(
      id: NotificationId(dto.id),
      type: type,
      category: _category(type),
      priority: NotificationPriority.values.byName(dto.priority),
      readState: NotificationReadState.unread,
      occurredAt: DateTime.parse(dto.occurredAt).toUtc(),
      receivedAt: DateTime.parse(dto.occurredAt).toUtc(),
      groupKey: dto.groupKey,
      payload: NotificationPayload(
        doctorName: dto.doctorName,
        clinicName: dto.clinicName,
        minutes: dto.minutes,
        queueNumber: dto.queueNumber,
        message: dto.message,
      ),
      action: NotificationAction(_destination(type), targetId: dto.targetId),
      profileId: dto.profileId == null
          ? null
          : PatientProfileId(dto.profileId!),
    );
  }

  NotificationCategory _category(PatientNotificationType type) =>
      switch (type) {
        PatientNotificationType.bookingConfirmed ||
        PatientNotificationType.appointmentReminder24Hours ||
        PatientNotificationType.appointmentReminder2Hours ||
        PatientNotificationType.appointmentCancelled ||
        PatientNotificationType.appointmentRescheduled ||
        PatientNotificationType.appointmentCheckedIn =>
          NotificationCategory.appointment,
        PatientNotificationType.queueOpened ||
        PatientNotificationType.queueNumberUpdated ||
        PatientNotificationType.almostYourTurn ||
        PatientNotificationType.doctorRunningBehind ||
        PatientNotificationType.doctorRunningAhead =>
          NotificationCategory.queue,
        PatientNotificationType.clinicAnnouncement ||
        PatientNotificationType.clinicTemporaryClosure =>
          NotificationCategory.clinic,
        PatientNotificationType.accountWelcome ||
        PatientNotificationType.languageChanged => NotificationCategory.account,
        _ => NotificationCategory.system,
      };

  NotificationDestination _destination(PatientNotificationType type) =>
      switch (type) {
        PatientNotificationType.bookingConfirmed ||
        PatientNotificationType.appointmentReminder24Hours ||
        PatientNotificationType.appointmentReminder2Hours ||
        PatientNotificationType.appointmentCancelled ||
        PatientNotificationType.appointmentRescheduled =>
          NotificationDestination.appointment,
        PatientNotificationType.queueOpened ||
        PatientNotificationType.queueNumberUpdated ||
        PatientNotificationType.almostYourTurn ||
        PatientNotificationType.doctorRunningBehind ||
        PatientNotificationType.doctorRunningAhead =>
          NotificationDestination.liveQueue,
        PatientNotificationType.authenticationRequired ||
        PatientNotificationType.languageChanged =>
          NotificationDestination.settings,
        _ => NotificationDestination.none,
      };
}
