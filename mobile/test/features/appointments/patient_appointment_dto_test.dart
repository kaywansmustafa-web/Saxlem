import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/features/appointments/data/dto/patient_appointment_dto.dart';

void main() {
  for (final status in [
    'scheduled',
    'confirmed',
    'cancelled',
    'completed',
    'noShow',
  ]) {
    test('parses authoritative $status appointment', () {
      final item = PatientAppointmentDto.parse(_appointment(status: status));
      expect(item.status.name, status);
      expect(item.version, 2);
    });
  }

  test('accepts nullable cancellation reason', () {
    expect(
      PatientAppointmentDto.parse(
        _appointment(status: 'cancelled', cancellationReason: 'Travel'),
      ).cancellationReason,
      'Travel',
    );
  });

  for (final mutation in <void Function(Map<String, dynamic>)>[
    (json) => json['id'] = 'bad',
    (json) => json['reference'] = 'private-id',
    (json) => json['startsAt'] = '2030-08-10',
    (json) => json['endsAt'] = '2030-08-10T06:20:00.000Z',
    (json) => json['version'] = 0,
    (json) => json['feeIqd'] = -1,
    (json) => json['cancellationReason'] = 4,
    (json) => json['extra'] = true,
  ]) {
    test('rejects malformed appointment response', () {
      final json = _appointment();
      mutation(json);
      expect(() => PatientAppointmentDto.parse(json), throwsFormatException);
    });
  }

  test('page rejects duplicate IDs, malformed cursor and excessive items', () {
    final item = _appointment();
    expect(
      () => PatientAppointmentDto.parsePage({
        'items': [item, Map<String, dynamic>.from(item)],
        'nextCursor': null,
      }),
      throwsFormatException,
    );
    expect(
      () => PatientAppointmentDto.parsePage({
        'items': [item],
        'nextCursor': 'bad cursor',
      }),
      throwsFormatException,
    );
    expect(
      () => PatientAppointmentDto.parsePage({
        'items': List.generate(
          51,
          (index) => _appointment(
            id: '00000000-0000-4000-8000-${index.toString().padLeft(12, '0')}',
          ),
        ),
        'nextCursor': null,
      }),
      throwsFormatException,
    );
  });
}

Map<String, dynamic> _appointment({
  String id = '00000000-0000-4000-8000-000000000001',
  String status = 'scheduled',
  Object? cancellationReason,
}) => {
  'id': id,
  'reference': 'SX-2030-000001',
  'clinicId': '00000000-0000-4000-8000-000000000002',
  'clinicName': 'Clinic',
  'doctorId': '00000000-0000-4000-8000-000000000003',
  'doctorName': 'Doctor',
  'patientProfileId': '00000000-0000-4000-8000-000000000004',
  'patientName': 'Patient',
  'type': 'initial',
  'reason': 'Consultation',
  'startsAt': '2030-08-10T06:00:00.000Z',
  'endsAt': '2030-08-10T06:30:00.000Z',
  'durationMinutes': 30,
  'feeIqd': 35000,
  'status': status,
  'cancellationReason': cancellationReason,
  'version': 2,
};
