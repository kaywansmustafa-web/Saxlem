import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

/// Supplies Flutter's framework strings for Badini Kurdish.
///
/// Saxlem owns its Kurdish product copy. Flutter does not currently ship
/// Material or Cupertino localizations for `ku`, so framework-owned strings
/// temporarily use Arabic, the closest supported RTL locale.
const badiniFrameworkLocalizationsDelegates = <LocalizationsDelegate<dynamic>>[
  BadiniWidgetsLocalizationsDelegate(),
  BadiniMaterialLocalizationsDelegate(),
  BadiniCupertinoLocalizationsDelegate(),
];

class BadiniWidgetsLocalizationsDelegate
    extends LocalizationsDelegate<WidgetsLocalizations> {
  const BadiniWidgetsLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) => locale.languageCode == 'ku';

  @override
  Future<WidgetsLocalizations> load(Locale locale) =>
      GlobalWidgetsLocalizations.delegate.load(const Locale('ar'));

  @override
  bool shouldReload(BadiniWidgetsLocalizationsDelegate old) => false;
}

class BadiniMaterialLocalizationsDelegate
    extends LocalizationsDelegate<MaterialLocalizations> {
  const BadiniMaterialLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) => locale.languageCode == 'ku';

  @override
  Future<MaterialLocalizations> load(Locale locale) =>
      GlobalMaterialLocalizations.delegate.load(const Locale('ar'));

  @override
  bool shouldReload(BadiniMaterialLocalizationsDelegate old) => false;
}

class BadiniCupertinoLocalizationsDelegate
    extends LocalizationsDelegate<CupertinoLocalizations> {
  const BadiniCupertinoLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) => locale.languageCode == 'ku';

  @override
  Future<CupertinoLocalizations> load(Locale locale) =>
      GlobalCupertinoLocalizations.delegate.load(const Locale('ar'));

  @override
  bool shouldReload(BadiniCupertinoLocalizationsDelegate old) => false;
}
