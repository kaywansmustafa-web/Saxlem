import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/core/calendar/calendar_link.dart';

void main() {
  test('builds a Google Calendar event in UTC with place and reference', () {
    final link = calendarLink(
      title: 'Visit with Dr. Shilan',
      startsAt: DateTime.utc(2030, 8, 10, 6, 30),
      endsAt: DateTime.utc(2030, 8, 10, 7),
      location: 'Riverside Clinic',
      details: 'Appointment reference: SX-2030-000001',
    );
    expect(link.host, 'calendar.google.com');
    expect(link.queryParameters['action'], 'TEMPLATE');
    expect(link.queryParameters['dates'], '20300810T063000Z/20300810T070000Z');
    expect(link.queryParameters['location'], 'Riverside Clinic');
  });
}
