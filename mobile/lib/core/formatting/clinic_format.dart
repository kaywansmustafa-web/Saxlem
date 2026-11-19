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

  // Monday first, as DateTime.weekday counts. Badini names match the portals.
  static const _enWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];
  static const _arWeek = [
    'الاثنين',
    'الثلاثاء',
    'الأربعاء',
    'الخميس',
    'الجمعة',
    'السبت',
    'الأحد',
  ];
  static const _kuWeek = [
    'دووشەمبی',
    'سێشەمبی',
    'چارشەمبی',
    'پێنجشەمبی',
    'ئەینی',
    'شەمبی',
    'یەکشەمبی',
  ];

  /// "Aug" / "آب" / "تەباخ".
  static String month(DateTime value, String languageCode) =>
      switch (languageCode) {
        'ar' => _ar,
        'ku' => _ku,
        _ => _en,
      }[value.month - 1];

  /// "Sat" / "السبت" / "شەمبی" for a day chip.
  static String weekdayShort(DateTime value, String languageCode) =>
      switch (languageCode) {
        'ar' => _arWeek[value.weekday - 1],
        'ku' => _kuWeek[value.weekday - 1],
        _ => _enWeek[value.weekday - 1].substring(0, 3),
      };

  /// "Saturday, 10 Aug 2030" / "السبت، 10 آب 2030".
  static String weekdayDay(DateTime value, String languageCode) {
    final name = switch (languageCode) {
      'ar' => _arWeek[value.weekday - 1],
      'ku' => _kuWeek[value.weekday - 1],
      _ => _enWeek[value.weekday - 1],
    };
    final comma = languageCode == 'en' ? ',' : '،';
    return '$name$comma ${day(value, languageCode)}';
  }

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
