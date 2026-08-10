import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/features/arrival/data/dto/patient_arrival_dto.dart';
import 'package:saxlem_app/features/arrival/domain/entities/patient_arrival.dart';

void main() {
  Map<String, dynamic> value() => {
    'id': '11111111-1111-4111-8111-111111111111',
    'appointmentId': '22222222-2222-4222-8222-222222222222',
    'appointmentReference': 'SX-2026-000001',
    'clinicId': '33333333-3333-4333-8333-333333333333',
    'clinicName': 'Clinic',
    'doctorId': '44444444-4444-4444-8444-444444444444',
    'doctorName': 'Doctor',
    'patientProfileId': '55555555-5555-4555-8555-555555555555',
    'patientName': 'Patient',
    'appointmentStartsAt': '2026-08-10T09:00:00+03:00',
    'status': 'expected',
    'arrivedAt': null,
    'queueReadyAt': null,
    'version': 1,
    'arrivalEligibility': {
      'canArrive': true,
      'reason': 'eligible',
      'opensAt': '2026-08-10T08:00:00+03:00',
      'closesAt': '2026-08-10T09:30:00+03:00',
    },
  };
  test('strictly parses eligible arrival', () {
    final result = PatientArrivalDto.parse(value());
    expect(result.status, ArrivalStatus.expected);
    expect(result.eligibility.canArrive, isTrue);
  });
  test('rejects inconsistent status and eligibility', () {
    final json = value();
    json['arrivedAt'] = '2026-08-10T08:30:00+03:00';
    expect(() => PatientArrivalDto.parse(json), throwsFormatException);
  });
  test('rejects unknown response fields', () {
    final json = value();
    json['phoneNumber'] = 'hidden';
    expect(() => PatientArrivalDto.parse(json), throwsFormatException);
  });
  test('accepts every authoritative eligibility reason', () {
    for (final reason in const [
      'tooEarly',
      'tooLate',
      'invalidAppointmentStatus',
      'alreadyArrived',
      'queueReady',
      'unavailable',
    ]) {
      final json = value();
      if (reason == 'alreadyArrived') {
        json['status'] = 'arrived';
        json['arrivedAt'] = '2026-08-10T08:30:00+03:00';
      } else if (reason == 'queueReady') {
        json['status'] = 'queueReady';
        json['arrivedAt'] = '2026-08-10T08:30:00+03:00';
        json['queueReadyAt'] = '2026-08-10T08:31:00+03:00';
      }
      json['arrivalEligibility'] = {
        'canArrive': false,
        'reason': reason,
        'opensAt': reason == 'unavailable' ? null : '2026-08-10T08:00:00+03:00',
        'closesAt': reason == 'unavailable'
            ? null
            : '2026-08-10T09:30:00+03:00',
      };
      expect(PatientArrivalDto.parse(json).eligibility.canArrive, isFalse);
    }
  });
  test('rejects contradictory status reasons and arrival windows', () {
    final wrongStatus = value();
    wrongStatus['arrivalEligibility'] = {
      'canArrive': false,
      'reason': 'alreadyArrived',
      'opensAt': '2026-08-10T08:00:00+03:00',
      'closesAt': '2026-08-10T09:30:00+03:00',
    };
    final reversedWindow = value();
    reversedWindow['arrivalEligibility'] = {
      'canArrive': true,
      'reason': 'eligible',
      'opensAt': '2026-08-10T10:00:00+03:00',
      'closesAt': '2026-08-10T09:30:00+03:00',
    };
    expect(() => PatientArrivalDto.parse(wrongStatus), throwsFormatException);
    expect(
      () => PatientArrivalDto.parse(reversedWindow),
      throwsFormatException,
    );
  });
}
