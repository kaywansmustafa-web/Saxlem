import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/features/notifications/data/dto/backend_notification_dto.dart';
import 'package:saxlem_app/features/notifications/presentation/notification_copy.dart';
import 'package:saxlem_app/l10n/app_localizations.dart';

void main() {
  Map<String, dynamic> item(String type, Map<String, dynamic>? context) => {
    'id': '11111111-1111-4111-8111-111111111111',
    'patientProfileId': null,
    'deliverySequence': '42',
    'type': type,
    'priority': 'high',
    'actionCode': type,
    'occurredAt': '2026-08-10T09:00:00+03:00',
    'createdAt': '2026-08-10T09:00:01+03:00',
    'readAt': null,
    'context': context,
  };
  final en = NotificationCopy(lookupAppLocalizations(const Locale('en')));
  final ku = NotificationCopy(lookupAppLocalizations(const Locale('ku')));

  test('a reminder names the doctor, clinic and clinic-time date', () {
    final copy = en.forItem(
      BackendNotificationDto.parse(
        item('appointment.reminder.day-before', {
          'doctorName': 'Dr. Shilan',
          'clinicName': 'Riverside Clinic',
          'startsAt': '2026-08-11T07:30:00.000Z',
        }),
      ),
    );
    expect(copy.title, 'Your visit is tomorrow');
    expect(
      copy.happened,
      'Dr. Shilan at Riverside Clinic · Tuesday, 11 Aug 2026 · 10:30',
    );
  });

  test('being called says so, with the ticket', () {
    final copy = en.forItem(
      BackendNotificationDto.parse(
        item('queue.patient.called', {
          'doctorName': 'Dr. Shilan',
          'ticketNumber': 7,
        }),
      ),
    );
    expect(copy.title, "It's your turn");
    expect(copy.happened, 'Ticket 7 · Dr. Shilan');
  });

  test('almost your turn counts the people ahead, in Badini too', () {
    final next = en.forItem(
      BackendNotificationDto.parse(
        item('queue.patient.almost', {'ticketNumber': 3, 'ahead': 0}),
      ),
    );
    expect(next.title, "You're next");
    expect(next.happened, 'Ticket 3 · Nobody ahead of you');
    final two = ku.forItem(
      BackendNotificationDto.parse(
        item('queue.patient.almost', {'ticketNumber': 5, 'ahead': 2}),
      ),
    );
    expect(two.happened, contains('5'));
    expect(two.happened, isNot(matches(RegExp('[A-Za-z]'))));
  });
}
