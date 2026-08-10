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
      payload: const NotificationPayload(),
      action: _action(action),
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

  static DateTime? _nullableDate(Object? value) =>
      value == null ? null : _date(value);
  static PatientNotificationType _mappedType(String value) => switch (value) {
    'queue.session.opened' => PatientNotificationType.queueOpened,
    'queue.patient.called' ||
    'queue.patient.recalled' => PatientNotificationType.almostYourTurn,
    'queue.entry.enqueued' => PatientNotificationType.queueNumberUpdated,
    'queue.patient.no-response' =>
      PatientNotificationType.authenticationRequired,
    'queue.consultation.started' =>
      PatientNotificationType.appointmentCheckedIn,
    'queue.consultation.completed' =>
      PatientNotificationType.appointmentReminder2Hours,
    _ => PatientNotificationType.systemOfflineMode,
  };
  static NotificationCategory _category(String value) =>
      value.startsWith('queue.')
      ? NotificationCategory.queue
      : value.startsWith('appointment.')
      ? NotificationCategory.appointment
      : NotificationCategory.system;
  static NotificationAction _action(String value) =>
      const {
        'queue.session.opened',
        'queue.session.paused',
        'queue.session.resumed',
        'queue.session.closed',
        'queue.entry.enqueued',
        'queue.patient.called',
        'queue.patient.recalled',
        'queue.patient.no-response',
        'queue.consultation.started',
        'queue.consultation.completed',
      }.contains(value)
      ? const NotificationAction(NotificationDestination.appointment)
      : const NotificationAction.none();
}

// ignore_for_file: curly_braces_in_flow_control_structures
