import '../../domain/entities/patient_arrival.dart';

class PatientArrivalDto {
  static final _uuid = RegExp(
    r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$',
  );
  static final _reference = RegExp(r'^SX-\d{4}-\d{6,}$');
  static final _instant = RegExp(
    r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$',
  );

  static PatientArrival parse(Map<String, dynamic> json) {
    const required = {
      'id',
      'appointmentId',
      'appointmentReference',
      'clinicId',
      'clinicName',
      'doctorId',
      'doctorName',
      'patientProfileId',
      'patientName',
      'appointmentStartsAt',
      'status',
      'arrivedAt',
      'queueReadyAt',
      'version',
      'arrivalEligibility',
    };
    if (json.keys.length != required.length ||
        json.keys.toSet().difference(required).isNotEmpty ||
        required.difference(json.keys.toSet()).isNotEmpty)
      throw const FormatException();
    final status = switch (json['status']) {
      'expected' => ArrivalStatus.expected,
      'arrived' => ArrivalStatus.arrived,
      'queueReady' => ArrivalStatus.queueReady,
      _ => throw const FormatException(),
    };
    final eligibilityJson = json['arrivalEligibility'];
    if (eligibilityJson is! Map<String, dynamic>) throw const FormatException();
    final eligibility = _eligibility(eligibilityJson);
    final arrivedAt = _nullableInstant(json['arrivedAt']);
    final queueReadyAt = _nullableInstant(json['queueReadyAt']);
    if ((status == ArrivalStatus.expected &&
            (arrivedAt != null || queueReadyAt != null)) ||
        (status == ArrivalStatus.arrived &&
            (arrivedAt == null || queueReadyAt != null)) ||
        (status == ArrivalStatus.queueReady &&
            (arrivedAt == null || queueReadyAt == null)) ||
        (eligibility.canArrive !=
            (eligibility.reason == ArrivalEligibilityReason.eligible)) ||
        !_statusMatchesEligibility(status, eligibility.reason) ||
        !_validWindow(eligibility)) {
      throw const FormatException();
    }
    final reference = _text(json, 'appointmentReference', 64);
    if (!_reference.hasMatch(reference)) throw const FormatException();
    final version = json['version'];
    if (version is! int || version < 1) throw const FormatException();
    return PatientArrival(
      id: _uuidValue(json, 'id'),
      appointmentId: _uuidValue(json, 'appointmentId'),
      appointmentReference: reference,
      clinicId: _uuidValue(json, 'clinicId'),
      clinicName: _text(json, 'clinicName', 256),
      doctorId: _uuidValue(json, 'doctorId'),
      doctorName: _text(json, 'doctorName', 256),
      patientProfileId: _uuidValue(json, 'patientProfileId'),
      patientName: _text(json, 'patientName', 256),
      appointmentStartsAt: _instantValue(json['appointmentStartsAt']),
      status: status,
      arrivedAt: arrivedAt,
      queueReadyAt: queueReadyAt,
      version: version,
      eligibility: eligibility,
    );
  }

  static bool _statusMatchesEligibility(
    ArrivalStatus status,
    ArrivalEligibilityReason reason,
  ) => switch (status) {
    ArrivalStatus.expected =>
      reason != ArrivalEligibilityReason.alreadyArrived &&
          reason != ArrivalEligibilityReason.queueReady,
    ArrivalStatus.arrived => reason == ArrivalEligibilityReason.alreadyArrived,
    ArrivalStatus.queueReady => reason == ArrivalEligibilityReason.queueReady,
  };

  static bool _validWindow(ArrivalEligibility eligibility) {
    final opens = eligibility.opensAt, closes = eligibility.closesAt;
    if ((opens == null) != (closes == null)) return false;
    if (opens != null && closes != null && opens.isAfter(closes)) return false;
    if (eligibility.reason == ArrivalEligibilityReason.unavailable) {
      return opens == null && closes == null;
    }
    return opens != null && closes != null;
  }

  static ArrivalEligibility _eligibility(Map<String, dynamic> json) {
    const keys = {'canArrive', 'reason', 'opensAt', 'closesAt'};
    if (json.keys.length != keys.length ||
        json.keys.toSet().difference(keys).isNotEmpty ||
        keys.difference(json.keys.toSet()).isNotEmpty ||
        json['canArrive'] is! bool)
      throw const FormatException();
    return ArrivalEligibility(
      canArrive: json['canArrive'] as bool,
      reason: switch (json['reason']) {
        'eligible' => ArrivalEligibilityReason.eligible,
        'tooEarly' => ArrivalEligibilityReason.tooEarly,
        'tooLate' => ArrivalEligibilityReason.tooLate,
        'invalidAppointmentStatus' =>
          ArrivalEligibilityReason.invalidAppointmentStatus,
        'alreadyArrived' => ArrivalEligibilityReason.alreadyArrived,
        'queueReady' => ArrivalEligibilityReason.queueReady,
        'unavailable' => ArrivalEligibilityReason.unavailable,
        _ => throw const FormatException(),
      },
      opensAt: _nullableInstant(json['opensAt']),
      closesAt: _nullableInstant(json['closesAt']),
    );
  }

  static String _text(Map<String, dynamic> json, String key, int max) {
    final value = json[key];
    if (value is! String || value.trim().isEmpty || value.length > max)
      throw const FormatException();
    return value;
  }

  static String _uuidValue(Map<String, dynamic> json, String key) {
    final value = _text(json, key, 36);
    if (!_uuid.hasMatch(value)) throw const FormatException();
    return value;
  }

  static DateTime _instantValue(Object? value) {
    if (value is! String || !_instant.hasMatch(value))
      throw const FormatException();
    final parsed = DateTime.tryParse(value);
    if (parsed == null) throw const FormatException();
    return parsed;
  }

  static DateTime? _nullableInstant(Object? value) =>
      value == null ? null : _instantValue(value);
}

// ignore_for_file: curly_braces_in_flow_control_structures
