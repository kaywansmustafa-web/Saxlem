import 'package:flutter/widgets.dart';
import 'package:intl/intl.dart';

/// Formats [date] with an intl [pattern] in the active locale. Badini uses
/// Arabic date names (as Flutter's framework strings do); unknown locales fall
/// back to English rather than throwing.
String formatLocalizedDate(
  BuildContext context,
  DateTime date,
  String pattern,
) {
  final code = Localizations.localeOf(context).languageCode;
  final locale = code == 'ku' ? 'ar' : code;
  try {
    return DateFormat(pattern, locale).format(date);
  } catch (_) {
    return DateFormat(pattern, 'en').format(date);
  }
}
