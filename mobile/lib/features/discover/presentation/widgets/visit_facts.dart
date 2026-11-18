import 'package:flutter/widgets.dart';

import '../../../../core/formatting/clinic_format.dart';
import '../../../../core/localization/localization_extensions.dart';

/// "25,000 IQD".
String feeText(BuildContext context, int iqd) =>
    context.l10n.iqdAmount(ClinicFormat.number(iqd));

/// The earliest free time, as a patient reads it: "Today 14:30",
/// "Tomorrow 09:00" or "Thu, 20 Nov · 10:30" (clinic time).
String nextFreeText(BuildContext context, DateTime instant, {DateTime? now}) {
  final strings = context.l10n;
  final lang = Localizations.localeOf(context).languageCode;
  final at = ClinicFormat.atClinic(instant);
  final today = ClinicFormat.atClinic(now ?? DateTime.now());
  final days = DateTime(
    at.year,
    at.month,
    at.day,
  ).difference(DateTime(today.year, today.month, today.day)).inDays;
  final time = ClinicFormat.time(instant);
  if (days <= 0) return '${strings.todayChip} $time';
  if (days == 1) return '${strings.tomorrowChip} $time';
  final comma = lang == 'en' ? ',' : '،';
  final day = ClinicFormat.day(at, lang).split(' ').take(2).join(' ');
  return '${ClinicFormat.weekdayShort(at, lang)}$comma $day · $time';
}
