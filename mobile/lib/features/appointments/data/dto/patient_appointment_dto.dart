import '../../../../core/models/doctor_reference.dart';
import '../../../../core/models/patient_profile.dart';
import '../../domain/entities/appointments_snapshot.dart';
import '../../domain/entities/patient_appointment.dart';

class PatientAppointmentDto {
  static final _uuid = RegExp(
    r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$',
  );
  static final _reference = RegExp(r'^SX-\d{4}-\d{6,}$');
  static final _instant = RegExp(
    r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$',
  );
  static final _cursor = RegExp(r'^[\x21-\x7e]{1,1024}$');

  static PatientAppointment parse(Map<String, dynamic> json) {
    const keys = {
      'id',
      'reference',
      'clinicId',
      'clinicName',
      'doctorId',
      'doctorName',
      'patientProfileId',
      'patientName',
      'type',
      'reason',
      'startsAt',
      'endsAt',
      'durationMinutes',
      'feeIqd',
      'status',
      'cancellationReason',
      'version',
    };
    if (json.keys.length != keys.length ||
        json.keys.toSet().difference(keys).isNotEmpty ||
        keys.difference(json.keys.toSet()).isNotEmpty) {
      throw const FormatException();
    }
    final id = _uuidValue(json, 'id');
    final reference = _text(json, 'reference', 64);
    if (!_reference.hasMatch(reference)) throw const FormatException();
    final clinicId = _uuidValue(json, 'clinicId');
    final doctorId = _uuidValue(json, 'doctorId');
    final profileId = _uuidValue(json, 'patientProfileId');
    final startsAt = _dateTime(json, 'startsAt');
    final endsAt = _dateTime(json, 'endsAt');
    final duration = _integer(json, 'durationMinutes', minimum: 5);
    if (duration > 480) throw const FormatException();
    if (!endsAt.isAfter(startsAt) ||
        endsAt.difference(startsAt).inMinutes != duration) {
      throw const FormatException();
    }
    final cancellation = json['cancellationReason'];
    if (cancellation != null &&
        (cancellation is! String ||
            cancellation.trim().isEmpty ||
            cancellation.length > 500)) {
      throw const FormatException();
    }
    return PatientAppointment(
      id: id,
      reference: reference,
      doctor: DoctorReference(
        id: doctorId,
        displayName: _text(json, 'doctorName', 256),
        specialtyDisplayName: '',
      ),
      clinicId: clinicId,
      clinicName: _text(json, 'clinicName', 256),
      profileId: PatientProfileId(profileId),
      patientName: _text(json, 'patientName', 256),
      type: switch (json['type']) {
        'initial' => PatientAppointmentType.initial,
        'followUp' => PatientAppointmentType.followUp,
        _ => throw const FormatException(),
      },
      reason: _text(json, 'reason', 500),
      startsAt: startsAt,
      endsAt: endsAt,
      durationMinutes: duration,
      feeIqd: _integer(json, 'feeIqd', minimum: 0),
      status: switch (json['status']) {
        'scheduled' => PatientAppointmentStatus.scheduled,
        'confirmed' => PatientAppointmentStatus.confirmed,
        'cancelled' => PatientAppointmentStatus.cancelled,
        'completed' => PatientAppointmentStatus.completed,
        'noShow' => PatientAppointmentStatus.noShow,
        _ => throw const FormatException(),
      },
      cancellationReason: cancellation as String?,
      version: _integer(json, 'version', minimum: 1),
    );
  }

  static AppointmentPage parsePage(Map<String, dynamic> json) {
    const keys = {'items', 'nextCursor'};
    if (json.keys.length != keys.length ||
        json.keys.toSet().difference(keys).isNotEmpty ||
        keys.difference(json.keys.toSet()).isNotEmpty ||
        json['items'] is! List) {
      throw const FormatException();
    }
    final raw = json['items'] as List;
    if (raw.length > 50) throw const FormatException();
    final items = <PatientAppointment>[];
    final ids = <String>{};
    for (final value in raw) {
      if (value is! Map<String, dynamic>) throw const FormatException();
      final item = parse(value);
      if (!ids.add(item.id)) throw const FormatException();
      items.add(item);
    }
    final cursor = json['nextCursor'];
    if (cursor != null && (cursor is! String || !_cursor.hasMatch(cursor))) {
      throw const FormatException();
    }
    return AppointmentPage(
      items: List.unmodifiable(items),
      nextCursor: cursor as String?,
    );
  }

  static String _text(Map<String, dynamic> json, String key, int maximum) {
    final value = json[key];
    if (value is! String || value.trim().isEmpty || value.length > maximum) {
      throw const FormatException();
    }
    return value;
  }

  static String _uuidValue(Map<String, dynamic> json, String key) {
    final value = _text(json, key, 36);
    if (!_uuid.hasMatch(value)) throw const FormatException();
    return value;
  }

  static int _integer(
    Map<String, dynamic> json,
    String key, {
    required int minimum,
  }) {
    final value = json[key];
    if (value is! int || value < minimum) throw const FormatException();
    return value;
  }

  static DateTime _dateTime(Map<String, dynamic> json, String key) {
    final value = json[key];
    if (value is! String || !_instant.hasMatch(value)) {
      throw const FormatException();
    }
    final result = DateTime.tryParse(value);
    if (result == null) throw const FormatException();
    return result;
  }
}
