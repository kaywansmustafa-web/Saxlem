import '../../domain/entities/booking_confirmation.dart';

class AppointmentResponseDto {
  static final _uuid = RegExp(
    r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$',
  );
  static BookingConfirmation parse(
    Map<String, dynamic> json, {
    required String clinicTimezone,
  }) {
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
    if (json.keys.toSet().difference(keys).isNotEmpty ||
        keys.difference(json.keys.toSet()).isNotEmpty ||
        !const ['initial', 'followUp'].contains(json['type']) ||
        !const [
          'scheduled',
          'confirmed',
          'cancelled',
          'completed',
          'noShow',
        ].contains(json['status']) ||
        json['cancellationReason'] != null &&
            (json['cancellationReason'] is! String ||
                (json['cancellationReason'] as String).trim().isEmpty ||
                (json['cancellationReason'] as String).length > 500)) {
      throw const FormatException('Invalid appointment response.');
    }
    String text(String key) {
      final value = json[key];
      if (value is! String || value.trim().isEmpty || value.length > 500) {
        throw const FormatException('Invalid appointment response.');
      }
      return value;
    }

    String uuid(String key) {
      final value = text(key);
      if (!_uuid.hasMatch(value)) throw const FormatException();
      return value;
    }

    int integer(String key, {int minimum = 0}) {
      final value = json[key];
      if (value is! int || value < minimum) throw const FormatException();
      return value;
    }

    final startsAt = DateTime.tryParse(text('startsAt'));
    final endsAt = DateTime.tryParse(text('endsAt'));
    text('reason');
    final duration = integer('durationMinutes', minimum: 1);
    if (startsAt == null ||
        endsAt == null ||
        !endsAt.isAfter(startsAt) ||
        endsAt.difference(startsAt).inMinutes != duration) {
      throw const FormatException();
    }
    return BookingConfirmation(
      appointmentId: uuid('id'),
      reference: text('reference'),
      clinicId: uuid('clinicId'),
      clinicName: text('clinicName'),
      clinicTimezone: clinicTimezone,
      doctorId: uuid('doctorId'),
      doctorName: text('doctorName'),
      patientProfileId: uuid('patientProfileId'),
      patientName: text('patientName'),
      startsAt: startsAt,
      endsAt: endsAt,
      durationMinutes: duration,
      feeIqd: integer('feeIqd'),
      version: integer('version', minimum: 1),
    );
  }
}
