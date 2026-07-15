enum PatientNotificationType {
  bookingConfirmed,
  appointmentReminder24Hours,
  appointmentReminder2Hours,
  appointmentCancelled,
  appointmentRescheduled,
  appointmentCheckedIn,
  queueOpened,
  queueNumberUpdated,
  almostYourTurn,
  doctorRunningBehind,
  doctorRunningAhead,
  clinicAnnouncement,
  clinicTemporaryClosure,
  accountWelcome,
  languageChanged,
  systemOfflineMode,
  authenticationRequired,
}

enum NotificationCategory { appointment, queue, clinic, account, system }

enum NotificationPriority { critical, high, normal, informational }

enum NotificationReadState { unread, read }

enum NotificationDestination {
  none,
  appointment,
  doctor,
  booking,
  liveQueue,
  settings,
}
