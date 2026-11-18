import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/features/notifications/data/dto/backend_notification_dto.dart';

void main() {
  Map<String, dynamic> item({
    String id = '11111111-1111-4111-8111-111111111111',
    String sequence = '42',
  }) => {
    'id': id,
    'patientProfileId': null,
    'deliverySequence': sequence,
    'type': 'queue.patient.called',
    'priority': 'high',
    'actionCode': 'queue.patient.called',
    'occurredAt': '2026-08-10T09:00:00+03:00',
    'createdAt': '2026-08-10T09:00:01+03:00',
    'readAt': null,
    'context': null,
  };
  test('parses authoritative unread notification and nullable profile', () {
    final value = BackendNotificationDto.parse(item());
    expect(value.deliverySequence, '42');
    expect(value.profileId, isNull);
    expect(value.isUnread, isTrue);
  });
  test('reads the doctor, ticket and time a patient notification is about', () {
    final json = item()
      ..['type'] = 'appointment.reminder.day-before'
      ..['actionCode'] = 'appointment.reminder.day-before'
      ..['context'] = {
        'appointmentId': '33333333-3333-4333-8333-333333333333',
        'doctorName': 'Dr. Shilan',
        'clinicName': 'Riverside Clinic',
        'startsAt': '2026-08-11T07:30:00.000Z',
        'ticketNumber': 4,
        'ahead': -1,
        'phone': '+9647500000000',
      };
    final value = BackendNotificationDto.parse(json);
    expect(value.payload.doctorName, 'Dr. Shilan');
    expect(value.payload.clinicName, 'Riverside Clinic');
    expect(value.payload.queueNumber, 4);
    expect(value.payload.ahead, isNull);
    expect(value.payload.startsAt, DateTime.utc(2026, 8, 11, 7, 30));
    expect(value.action.destination.name, 'appointment');
  });
  test('parses read notification', () {
    final json = item()..['readAt'] = '2026-08-10T09:01:00+03:00';
    expect(BackendNotificationDto.parse(json).isUnread, isFalse);
  });
  test('rejects malformed identity sequence timestamp and action', () {
    for (final json in [
      item(id: 'bad'),
      item(sequence: '0'),
      item()..['occurredAt'] = 'yesterday',
      item()..['actionCode'] = 'unsafe path',
      item()..['readAt'] = '2026-08-10T08:59:59+03:00',
      item()..['context'] = 'not an object',
      item()..remove('context'),
    ]) {
      expect(() => BackendNotificationDto.parse(json), throwsFormatException);
    }
  });
  test('page rejects duplicates, malformed cursor, and ordering', () {
    expect(
      () => BackendNotificationDto.parsePage({
        'items': [item(), item()],
        'nextCursor': null,
      }),
      throwsFormatException,
    );
    expect(
      () => BackendNotificationDto.parsePage({
        'items': [item()],
        'nextCursor': 'bad cursor',
      }),
      throwsFormatException,
    );
    expect(
      () => BackendNotificationDto.parsePage({
        'items': [
          item(sequence: '41'),
          item(id: '22222222-2222-4222-8222-222222222222', sequence: '42'),
        ],
        'nextCursor': null,
      }),
      throwsFormatException,
    );
  });
}
