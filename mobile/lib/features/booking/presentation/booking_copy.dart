import '../../../core/formatting/clinic_format.dart';

class BookingCopy {
  const BookingCopy();
  String fee(int v) => '${ClinicFormat.number(v)} IQD';

  /// "10 Aug 2030" in the reader's language (never the ambiguous 10/8/2030).
  String date(DateTime d, {String? timezone, String languageCode = 'en'}) =>
      ClinicFormat.day(_clinicTime(d, timezone), languageCode);

  String time(DateTime d, {String? timezone}) {
    final value = _clinicTime(d, timezone);
    return '${value.hour.toString().padLeft(2, '0')}:${value.minute.toString().padLeft(2, '0')}';
  }

  DateTime _clinicTime(DateTime value, String? timezone) =>
      timezone == 'Asia/Baghdad'
      ? value.toUtc().add(const Duration(hours: 3))
      : value.toUtc();
}
