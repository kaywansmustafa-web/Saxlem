/// Dates and money the same way in every language (matches the portals):
/// "10 Aug 2030", 24-hour times, Western digits, thousands separators.
abstract final class ClinicFormat {
  static const _en = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  static const _ar = [
    'كانون الثاني',
    'شباط',
    'آذار',
    'نيسان',
    'أيار',
    'حزيران',
    'تموز',
    'آب',
    'أيلول',
    'تشرين الأول',
    'تشرين الثاني',
    'كانون الأول',
  ];
  static const _ku = [
    'کانوونا دووێ',
    'شوبات',
    'ئادار',
    'نیسان',
    'گولان',
    'حزیران',
    'تیرمەه',
    'تەباخ',
    'ئیلوون',
    'چریا ئێکێ',
    'چریا دووێ',
    'کانوونا ئێکێ',
  ];

  /// "10 Aug 2030" / "10 آب 2030" / "10 تەباخ 2030".
  static String day(DateTime value, String languageCode) {
    final months = switch (languageCode) {
      'ar' => _ar,
      'ku' => _ku,
      _ => _en,
    };
    return '${value.day} ${months[value.month - 1]} ${value.year}';
  }

  /// The wall-clock moment at the clinic (Iraq is UTC+3 all year), whatever
  /// time zone the phone is set to.
  static DateTime atClinic(DateTime instant) =>
      instant.toUtc().add(const Duration(hours: 3));

  /// "16:30" at the clinic.
  static String time(DateTime instant) {
    final at = atClinic(instant);
    return '${at.hour.toString().padLeft(2, '0')}:${at.minute.toString().padLeft(2, '0')}';
  }

  /// "18 Nov 2030" for the day the visit happens at the clinic.
  static String clinicDay(DateTime instant, String languageCode) =>
      day(atClinic(instant), languageCode);

  /// 25000 → "25,000".
  static String number(int value) {
    final negative = value < 0;
    final digits = value.abs().toString();
    final out = StringBuffer();
    for (var i = 0; i < digits.length; i++) {
      if (i > 0 && (digits.length - i) % 3 == 0) out.write(',');
      out.write(digits[i]);
    }
    return '${negative ? '-' : ''}$out';
  }
}
