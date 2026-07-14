import 'package:flutter/widgets.dart';

enum SupportedAppLocale {
  english(Locale('en')),
  arabic(Locale('ar', 'IQ')),
  badini(Locale('ku', 'IQ'));

  const SupportedAppLocale(this.locale);
  final Locale locale;

  String get storageKey => switch (this) {
    english => 'en',
    arabic => 'ar_IQ',
    badini => 'ku_IQ',
  };

  static SupportedAppLocale? fromStorageKey(String? value) {
    for (final locale in values) {
      if (locale.storageKey == value) return locale;
    }
    return null;
  }

  static SupportedAppLocale fromLocale(Locale locale) => values.firstWhere(
    (item) => item.locale.languageCode == locale.languageCode,
    orElse: () => english,
  );
}
