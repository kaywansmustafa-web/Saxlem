/// A Google Calendar "add event" link (opens the app or the browser), so a
/// patient can keep the visit next to the rest of their week.
Uri calendarLink({
  required String title,
  required DateTime startsAt,
  required DateTime endsAt,
  String? location,
  String? details,
}) {
  String stamp(DateTime value) {
    final utc = value.toUtc();
    String two(int n) => n.toString().padLeft(2, '0');
    return '${utc.year}${two(utc.month)}${two(utc.day)}'
        'T${two(utc.hour)}${two(utc.minute)}${two(utc.second)}Z';
  }

  return Uri.https('calendar.google.com', '/calendar/render', {
    'action': 'TEMPLATE',
    'text': title,
    'dates': '${stamp(startsAt)}/${stamp(endsAt)}',
    if (location != null && location.isNotEmpty) 'location': location,
    if (details != null && details.isNotEmpty) 'details': details,
  });
}
