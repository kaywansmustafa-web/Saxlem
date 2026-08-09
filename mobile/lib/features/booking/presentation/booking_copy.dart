class BookingCopy {
  const BookingCopy();
  String fee(int v) {
    final s = v.toString();
    final b = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) b.write(',');
      b.write(s[i]);
    }
    return '$b IQD';
  }

  String date(DateTime d, {String? timezone}) {
    final value = _clinicTime(d, timezone);
    return '${value.day}/${value.month}/${value.year}';
  }

  String time(DateTime d, {String? timezone}) {
    final value = _clinicTime(d, timezone);
    return '${value.hour.toString().padLeft(2, '0')}:${value.minute.toString().padLeft(2, '0')}';
  }

  DateTime _clinicTime(DateTime value, String? timezone) =>
      timezone == 'Asia/Baghdad'
      ? value.toUtc().add(const Duration(hours: 3))
      : value.toUtc();
}
