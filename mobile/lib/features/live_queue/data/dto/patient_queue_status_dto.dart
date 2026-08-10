import '../../domain/entities/patient_queue_status.dart';

class PatientQueueStatusDto {
  static final _uuid = RegExp(
    r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$',
  );
  static final _instant = RegExp(
    r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$',
  );
  static PatientQueueStatus parse(
    String appointmentId,
    Map<String, dynamic> json,
  ) {
    const keys = {
      'queueState',
      'ticketNumber',
      'currentTicketNumber',
      'patientsAhead',
      'queueHealth',
      'instruction',
      'estimatedWait',
      'estimateSuspended',
      'doctor',
      'clinic',
      'appointmentReference',
      'patientEntryStatus',
      'updatedAt',
    };
    if (json.keys.length != keys.length ||
        json.keys.toSet().difference(keys).isNotEmpty ||
        keys.difference(json.keys.toSet()).isNotEmpty) {
      throw const FormatException();
    }
    final entry = switch (json['patientEntryStatus']) {
      'notEnqueued' => PatientEntryStatus.notEnqueued,
      'waiting' => PatientEntryStatus.waiting,
      'called' => PatientEntryStatus.called,
      'noResponse' => PatientEntryStatus.noResponse,
      'inConsultation' => PatientEntryStatus.inConsultation,
      'completed' => PatientEntryStatus.completed,
      'removed' => PatientEntryStatus.removed,
      _ => throw const FormatException(),
    };
    final ticket = _nullablePositive(json['ticketNumber']);
    final current = _nullablePositive(json['currentTicketNumber']);
    final ahead = _integer(json['patientsAhead']);
    final suspended = json['estimateSuspended'];
    if (suspended is! bool) throw const FormatException();
    final estimate = _wait(json['estimatedWait']);
    if (entry == PatientEntryStatus.notEnqueued &&
            (ticket != null || ahead != 0 || estimate != null) ||
        suspended && estimate != null)
      throw const FormatException();
    final instruction = json['instruction'];
    final reference = json['appointmentReference'];
    if (instruction is! String ||
        instruction.trim().isEmpty ||
        instruction.length > 1000 ||
        reference is! String ||
        reference.trim().isEmpty ||
        reference.length > 64)
      throw const FormatException();
    final updated = json['updatedAt'];
    if (updated is! String ||
        !_instant.hasMatch(updated) ||
        DateTime.tryParse(updated) == null)
      throw const FormatException();
    return PatientQueueStatus(
      appointmentId: appointmentId,
      queueState: switch (json['queueState']) {
        'notStarted' => QueueState.notStarted,
        'open' => QueueState.open,
        'paused' => QueueState.paused,
        'closed' => QueueState.closed,
        _ => throw const FormatException(),
      },
      ticketNumber: ticket,
      currentTicketNumber: current,
      patientsAhead: ahead,
      queueHealth: switch (json['queueHealth']) {
        null => null,
        'healthy' => QueueHealth.healthy,
        'busy' => QueueHealth.busy,
        'delayed' => QueueHealth.delayed,
        _ => throw const FormatException(),
      },
      instruction: instruction,
      estimatedWait: estimate,
      estimateSuspended: suspended,
      doctor: _reference(json['doctor']),
      clinic: _reference(json['clinic']),
      appointmentReference: reference,
      patientEntryStatus: entry,
      updatedAt: DateTime.parse(updated),
    );
  }

  static QueueReference _reference(Object? raw) {
    if (raw is! Map<String, dynamic> ||
        raw.keys.length != 2 ||
        !raw.containsKey('id') ||
        !raw.containsKey('name'))
      throw const FormatException();
    final id = raw['id'], name = raw['name'];
    if (id is! String ||
        !_uuid.hasMatch(id) ||
        name is! String ||
        name.trim().isEmpty ||
        name.length > 256)
      throw const FormatException();
    return QueueReference(id, name);
  }

  static int _integer(Object? value) {
    if (value is! int || value < 0) throw const FormatException();
    return value;
  }

  static int? _nullablePositive(Object? value) {
    if (value == null) return null;
    if (value is! int || value < 1) throw const FormatException();
    return value;
  }

  static EstimatedWait? _wait(Object? raw) {
    if (raw == null) return null;
    if (raw is! Map<String, dynamic> ||
        raw.keys.length != 2 ||
        !raw.containsKey('minimumMinutes') ||
        !raw.containsKey('maximumMinutes'))
      throw const FormatException();
    final min = _integer(raw['minimumMinutes']),
        max = _integer(raw['maximumMinutes']);
    if (max < min) throw const FormatException();
    return EstimatedWait(min, max);
  }
}

// ignore_for_file: curly_braces_in_flow_control_structures
