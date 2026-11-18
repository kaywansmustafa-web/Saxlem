import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/core/formatting/clinic_format.dart';

void main() {
  // Saturday 10 August 2030.
  final saturday = DateTime(2030, 8, 10);

  test('day uses the same month names as the portals', () {
    expect(ClinicFormat.day(saturday, 'en'), '10 Aug 2030');
    expect(ClinicFormat.day(saturday, 'ar'), '10 آب 2030');
    expect(ClinicFormat.day(saturday, 'ku'), '10 تەباخ 2030');
  });

  test('weekday names, Western digits in every language', () {
    expect(ClinicFormat.weekdayShort(saturday, 'en'), 'Sat');
    expect(ClinicFormat.weekdayShort(saturday, 'ar'), 'السبت');
    expect(ClinicFormat.weekdayShort(saturday, 'ku'), 'شەمبی');
    expect(ClinicFormat.weekdayDay(saturday, 'en'), 'Saturday, 10 Aug 2030');
    expect(ClinicFormat.weekdayDay(saturday, 'ar'), 'السبت، 10 آب 2030');
    expect(ClinicFormat.month(saturday, 'ar'), 'آب');
  });

  test('clinic time is Iraq time whatever the phone says', () {
    final instant = DateTime.utc(2030, 8, 10, 22, 30);
    expect(ClinicFormat.time(instant), '01:30');
    expect(ClinicFormat.clinicDay(instant, 'en'), '11 Aug 2030');
    expect(ClinicFormat.number(25000), '25,000');
  });
}
