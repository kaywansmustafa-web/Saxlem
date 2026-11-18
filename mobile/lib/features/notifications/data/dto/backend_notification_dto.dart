import '../../../../core/models/patient_profile.dart';
import '../../domain/entities/notification_page.dart';
import '../../domain/entities/notification_types.dart';
import '../../domain/entities/patient_notification.dart';

class BackendNotificationDto {
  static final _uuid = RegExp(
    r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$',
  );
  static final _sequence = RegExp(r'^[1-9]\d{0,18}$');
  static final _code = RegExp(r'^[a-z][a-z0-9.-]{0,127}$');
  static final _instant = RegExp(
    r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$',
  );
  static PatientNotification parse(Map<String, dynamic> json) {
    const keys = {
      'id',
      'patientProfileId',
      'deliverySequence',
      'type',
      'priority',
      'actionCode',
      'occurredAt',
      'createdAt',
      'readAt',
      'context',
    };
    if (json.keys.length != keys.length ||
        json.keys.toSet().difference(keys).isNotEmpty ||
        keys.difference(json.keys.toSet()).isNotEmpty)
      throw const FormatException();
    final id = _uuidValue(json['id']);
    final profile = json['patientProfileId'];
    if (profile != null && (profile is! String || !_uuid.hasMatch(profile)))
      throw const FormatException();
    final sequence = json['deliverySequence'];
    final type = json['type'];
    final action = json['actionCode'];
    if (sequence is! String ||
        !_sequence.hasMatch(sequence) ||
        type is! String ||
        !_code.hasMatch(type) ||
        action is! String ||
        !_code.hasMatch(action))
      throw const FormatException();
    final occurred = _date(json['occurredAt']),
        created = _date(json['createdAt']),
        read = _nullableDate(json['readAt']);
    if (created.isBefore(occurred) || read != null && read.isBefore(created)) {
      throw const FormatException();
    }
    final mapped = _mappedType(type);
    final payload = _payload(json['context']);
    return PatientNotification(
      id: NotificationId(id),
      type: mapped,
      category: _category(type),
      priority: switch (json['priority']) {
        'high' => NotificationPriority.high,
        'normal' => NotificationPriority.normal,
        'information' => NotificationPriority.informational,
        _ => throw const FormatException(),
      },
      readState: read == null
          ? NotificationReadState.unread
          : NotificationReadState.read,
      occurredAt: occurred,
      receivedAt: created,
      payload: payload,
      action: _action(action, payload.appointmentId),
      profileId: profile == null ? null : PatientProfileId(profile),
      deliverySequence: sequence,
      actionCode: action,
    );
  }

  static NotificationPage parsePage(Map<String, dynamic> json) {
    const keys = {'items', 'nextCursor'};
    if (json.keys.length != 2 ||
        json.keys.toSet().difference(keys).isNotEmpty ||
        json['items'] is! List)
      throw const FormatException();
    final items = <PatientNotification>[], ids = <String>{};
    for (final raw in json['items'] as List) {
      if (raw is! Map<String, dynamic>) throw const FormatException();
      final item = parse(raw);
      if (!ids.add(item.id.value)) throw const FormatException();
      items.add(item);
    }
    final cursor = json['nextCursor'];
    if (cursor != null &&
        (cursor is! String ||
            !RegExp(r'^[\x21-\x7e]{1,512}$').hasMatch(cursor)))
      throw const FormatException();
    for (var i = 1; i < items.length; i++) {
      if (BigInt.parse(items[i - 1].deliverySequence) <=
          BigInt.parse(items[i].deliverySequence))
        throw const FormatException();
    }
    return NotificationPage(items: items, nextCursor: cursor as String?);
  }

  static String _uuidValue(Object? value) {
    if (value is! String || !_uuid.hasMatch(value))
      throw const FormatException();
    return value;
  }

  static DateTime _date(Object? value) {
    if (value is! String || !_instant.hasMatch(value))
      throw const FormatException();
    final parsed = DateTime.tryParse(value);
    if (parsed == null) throw const FormatException();
    return parsed;
  }

  /// Doctor, clinic, time and ticket the backend sends with a patient's own
  /// notifications. Unknown or malformed fields are dropped, not trusted.
  static NotificationPayload _payload(Object? value) {
    if (value == null) return const NotificationPayload();
    if (value is! Map<String, dynamic>) throw const FormatException();
    String? text(String key) {
      final raw = value[key];
      return raw is String && raw.trim().isNotEmpty && raw.length <= 200
          ? raw.trim()
          : null;
    }

    int? count(String key) {
      final raw = value[key];
      return raw is int && raw >= 0 ? raw : null;
    }

    final starts = value['startsAt'];
    final appointment = value['appointmentId'];
    return NotificationPayload(
      doctorName: text('doctorName'),
      clinicName: text('clinicName'),
      queueNumber: count('ticketNumber'),
      ahead: count('ahead'),
      startsAt: starts is String && _instant.hasMatch(starts)
          ? DateTime.tryParse(starts)
          : null,
      appointmentId: appointment is String && _uuid.hasMatch(appointment)
          ? appointment
          : null,
    );
  }

  static DateTime? _nullableDate(Object? value) =>
      value == null ? null : _date(value);
  static PatientNotificationType _mappedType(String value) => switch (value) {
    'appointment.booked' => PatientNotificationType.bookingConfirmed,
    'appointment.cancelled.by-clinic' =>
      PatientNotificationType.appointmentCancelled,
    'appointment.rescheduled.by-clinic' =>
      PatientNotificationType.appointmentRescheduled,
    'appointment.reminder.day-before' =>
      PatientNotificationType.appointmentReminder24Hours,
    'appointment.reminder.soon' =>
      PatientNotificationType.appointmentReminder2Hours,
    'appointment.review.requested' => PatientNotificationType.reviewRequested,
    'appointment.earlier.available' =>
      PatientNotificationType.earlierTimeAvailable,
    'queue.patient.almost' => PatientNotificationType.almostYourTurn,
    'queue.session.opened' => PatientNotificationType.queueOpened,
    'queue.session.paused' => PatientNotificationType.queuePaused,
    'queue.session.resumed' => PatientNotificationType.queueResumed,
    'queue.session.closed' => PatientNotificationType.queueClosed,
    'queue.entry.enqueued' => PatientNotificationType.queueNumberUpdated,
    'queue.patient.called' ||
    'queue.patient.recalled' => PatientNotificationType.calledIn,
    'queue.patient.no-response' => PatientNotificationType.missedTurn,
    'queue.consultation.started' => PatientNotificationType.consultationStarted,
    'queue.consultation.completed' => PatientNotificationType.visitCompleted,
    _ => PatientNotificationType.systemOfflineMode,
  };
  static NotificationCategory _category(String value) =>
      value.startsWith('queue.')
      ? NotificationCategory.queue
      : value.startsWith('appointment.')
      ? NotificationCategory.appointment
      : NotificationCategory.system;

  /// Where tapping goes: the live queue for queue news about a visit, the
  /// visit itself for booking news, or the Appointments tab when the
  /// notification doesn't say which visit.
  static NotificationAction _action(String value, String? appointmentId) {
    if (value.startsWith('queue.')) {
      return appointmentId == null
          ? const NotificationAction(NotificationDestination.appointment)
          : NotificationAction(
              NotificationDestination.liveQueue,
              targetId: appointmentId,
            );
    }
    if (value.startsWith('appointment.')) {
      return NotificationAction(
        NotificationDestination.appointment,
        targetId: appointmentId,
      );
    }
    return const NotificationAction.none();
  }
}

// ignore_for_file: curly_braces_in_flow_control_structures
