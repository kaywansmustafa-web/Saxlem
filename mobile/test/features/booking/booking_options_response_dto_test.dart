import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/features/booking/data/dto/booking_options_response_dto.dart';

void main() {
  Map<String, dynamic> valid() => {
    'doctorId': '0198a4ae-0000-7000-8000-000000000001',
    'doctorName': 'Doctor',
    'organizationId': '0198a4ae-0000-7000-8000-000000000002',
    'clinicId': '0198a4ae-0000-7000-8000-000000000003',
    'clinicName': 'Clinic',
    'clinicTimezone': 'Asia/Baghdad',
    'appointmentType': 'initial',
    'durationMinutes': 30,
    'feeIqd': 35000,
    'currency': 'IQD',
    'dateFrom': '2030-08-10',
    'dateTo': '2030-08-11',
    'days': [
      {
        'date': '2030-08-10',
        'slots': [
          {
            'startsAt': '2030-08-10T06:00:00.000Z',
            'endsAt': '2030-08-10T06:30:00.000Z',
            'durationMinutes': 30,
          },
        ],
      },
      {'date': '2030-08-11', 'slots': <Object?>[]},
    ],
    'generatedAt': '2030-08-09T20:00:00.000Z',
  };

  test('strictly parses an authoritative ordered response', () {
    final result = BookingOptionsResponseDto.parse(valid());
    expect(result.currency, 'IQD');
    expect(result.days.first.slots.single.durationMinutes, 30);
  });

  for (final mutation in <void Function(Map<String, dynamic>)>[
    (json) => json['doctorId'] = 'bad',
    (json) => json['currency'] = 'USD',
    (json) => json['clinicTimezone'] = 'Baghdad',
    (json) => json['appointmentType'] = 'review',
    (json) => json['durationMinutes'] = 0,
    (json) => json['feeIqd'] = -1,
    (json) => json['dateTo'] = '2030-08-09',
    (json) => (json['days'] as List).first['date'] = '2030-08-11',
    (json) => (json['days'] as List).first['slots'][0]['endsAt'] =
        '2030-08-10T05:30:00.000Z',
    (json) => (json['days'] as List).first['slots'][0]['durationMinutes'] = 20,
    _duplicateSlot,
    (json) =>
        json['days'] = List.filled(32, {'date': '2030-08-10', 'slots': []}),
    (json) => json['days'] = null,
  ]) {
    test('rejects malformed authoritative booking options', () {
      final json = valid();
      mutation(json);
      expect(
        () => BookingOptionsResponseDto.parse(json),
        throwsFormatException,
      );
    });
  }
}

void _duplicateSlot(Map<String, dynamic> json) {
  final day = (json['days'] as List).first as Map<String, dynamic>;
  final slots = List<dynamic>.from(day['slots'] as List);
  slots.add(Map<String, dynamic>.from(slots.first as Map));
  day['slots'] = slots;
}
