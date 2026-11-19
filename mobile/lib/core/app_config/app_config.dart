import 'dart:convert';

import 'package:flutter/widgets.dart';

/// Text in the app's three languages.
class LocalizedText {
  const LocalizedText({required this.en, required this.ar, required this.ku});
  final String en, ar, ku;

  String of(Locale locale) => switch (locale.languageCode) {
    'ar' => ar,
    'ku' => ku,
    _ => en,
  };

  Map<String, String> toJson() => {'en': en, 'ar': ar, 'ku': ku};
}

/// A specialty as the owner set it up (Owner Portal → Specialties).
class CatalogSpecialty {
  const CatalogSpecialty({
    required this.code,
    required this.names,
    required this.icon,
    required this.showOnHome,
  });
  final String code;
  final LocalizedText names;
  final String icon;
  final bool showOnHome;
}

/// A "What's bothering you?" tile (Owner Portal → Home tiles).
class HomeConcern {
  const HomeConcern({
    required this.id,
    required this.labels,
    required this.icon,
    required this.tone,
    required this.specialtyCodes,
  });
  final String id;
  final LocalizedText labels;
  final String icon;

  /// blue | rose | amber | aqua | lilac
  final String tone;
  final List<String> specialtyCodes;
}

/// What the owner controls from the Owner Portal: specialties, Home tiles
/// and app settings. Every getter has the value Saxlem shipped with, so the
/// app works the same before the first download or when offline.
class AppConfig {
  const AppConfig({
    this.specialties = const [],
    this.concerns = const [],
    this.settings = const {},
    this.fromServer = false,
  });

  /// Before anything is downloaded.
  static const builtIn = AppConfig();

  final List<CatalogSpecialty> specialties;
  final List<HomeConcern> concerns;
  final Map<String, Object> settings;
  final bool fromServer;

  bool flag(String key, {bool fallback = true}) =>
      settings[key] is bool ? settings[key]! as bool : fallback;
  int number(String key, int fallback) =>
      settings[key] is int ? settings[key]! as int : fallback;
  String text(String key, String fallback) =>
      settings[key] is String ? settings[key]! as String : fallback;

  // Contact and help
  String get emergencyNumber {
    final value = text('contact.emergencyNumber', '122');
    return value.isEmpty ? '122' : value;
  }

  String get supportWhatsApp => text('contact.supportWhatsApp', '');
  String get termsUrl => text('contact.termsUrl', '');
  String get privacyUrl => text('contact.privacyUrl', '');

  // Features
  bool get reviewsOn => flag('features.reviews');
  bool get earlierTimeOn => flag('features.earlierTime');
  bool get leaveByOn => flag('features.leaveBy');
  bool get savedDoctorsOn => flag('features.savedDoctors');
  bool get onlinePaymentsOn => flag('features.onlinePayments');

  // Home sections
  bool home(String section) => flag('home.$section');

  // Rules
  int get bookingDaysAhead =>
      number('booking.daysAhead', 14).clamp(1, 60).toInt();
  int get reviewCommentMax =>
      number('reviews.commentMax', 500).clamp(50, 2000).toInt();
  int get earlierTimeMinLeadHours =>
      number('earlierTime.minLeadHours', 3).clamp(1, 72).toInt();

  CatalogSpecialty? specialty(String code) {
    for (final item in specialties) {
      if (item.code == code) return item;
    }
    return null;
  }

  /// The specialty's name in [locale], or [fallback] (the server's English
  /// name) when the owner hasn't set it up.
  String specialtyName(String code, Locale locale, String fallback) =>
      specialty(code)?.names.of(locale) ?? fallback;

  /// The name in [locale] for a specialty the server sent by its English
  /// name (doctor cards, visits); unchanged when it isn't in the catalog.
  String localizedSpecialty(String englishName, Locale locale) {
    for (final item in specialties) {
      if (item.names.en == englishName) return item.names.of(locale);
    }
    return englishName;
  }

  /// Specialty position in the owner's order (unknown ones go last).
  int specialtyRank(String code) {
    final index = specialties.indexWhere((item) => item.code == code);
    return index < 0 ? specialties.length : index;
  }
}

/// Strict reader for GET /app/config: a malformed answer is refused whole.
class AppConfigParser {
  const AppConfigParser();

  static final _code = RegExp(r'^[a-z][a-z0-9-]{1,63}$');
  static final _key = RegExp(r'^[a-z][a-zA-Z]{1,31}\.[a-z][a-zA-Z0-9]{1,47}$');
  static final _icon = RegExp(r'^[a-z][a-z-]{1,31}$');
  static const _tones = {'blue', 'rose', 'amber', 'aqua', 'lilac'};

  AppConfig parse(Object? json) {
    final body = _map(json);
    final specialties = [
      for (final raw in _list(body['specialties'], 500)) _specialty(raw),
    ];
    final concerns = [
      for (final raw in _list(body['concerns'], 100)) _concern(raw),
    ];
    final settingsJson = _map(body['settings']);
    if (settingsJson.length > 200) throw const FormatException('settings');
    final settings = <String, Object>{};
    for (final MapEntry(:key, :value) in settingsJson.entries) {
      if (!_key.hasMatch(key)) throw FormatException('setting $key');
      if (value is bool || value is int) {
        settings[key] = value!;
      } else if (value is String && value.length <= 500) {
        settings[key] = value;
      } else {
        throw FormatException('setting $key');
      }
    }
    return AppConfig(
      specialties: List.unmodifiable(specialties),
      concerns: List.unmodifiable(concerns),
      settings: Map.unmodifiable(settings),
      fromServer: true,
    );
  }

  CatalogSpecialty _specialty(Object? raw) {
    final json = _map(raw);
    final code = json['code'];
    final icon = json['icon'];
    final showOnHome = json['showOnHome'];
    if (code is! String || !_code.hasMatch(code)) {
      throw const FormatException('specialty code');
    }
    if (icon is! String || !_icon.hasMatch(icon) || showOnHome is! bool) {
      throw const FormatException('specialty');
    }
    return CatalogSpecialty(
      code: code,
      names: _text(json['names'], 120),
      icon: icon,
      showOnHome: showOnHome,
    );
  }

  HomeConcern _concern(Object? raw) {
    final json = _map(raw);
    final id = json['id'];
    final icon = json['icon'];
    final tone = json['tone'];
    if (id is! String || id.length != 36) {
      throw const FormatException('concern id');
    }
    if (icon is! String || !_icon.hasMatch(icon)) {
      throw const FormatException('concern icon');
    }
    final codes = [
      for (final code in _list(json['specialtyCodes'], 20))
        if (code is String && _code.hasMatch(code))
          code
        else
          throw const FormatException('concern code'),
    ];
    return HomeConcern(
      id: id,
      labels: _text(json['labels'], 60),
      icon: icon,
      // An unknown colour from a newer server is drawn blue.
      tone: tone is String && _tones.contains(tone) ? tone : 'blue',
      specialtyCodes: List.unmodifiable(codes),
    );
  }

  LocalizedText _text(Object? raw, int max) {
    final json = _map(raw);
    String one(String key) {
      final value = json[key];
      if (value is! String || value.trim().isEmpty || value.length > max) {
        throw FormatException('text $key');
      }
      return value;
    }

    return LocalizedText(en: one('en'), ar: one('ar'), ku: one('ku'));
  }

  Map<String, Object?> _map(Object? value) {
    if (value is Map<String, Object?>) return value;
    if (value is Map) return value.cast<String, Object?>();
    throw const FormatException('object');
  }

  List<Object?> _list(Object? value, int max) {
    if (value is! List || value.length > max) {
      throw const FormatException('list');
    }
    return value.cast<Object?>();
  }
}

/// Turns a config back into the server's JSON shape (for the phone's copy).
String encodeAppConfig(AppConfig config) => jsonEncode({
  'specialties': [
    for (final s in config.specialties)
      {
        'code': s.code,
        'names': s.names.toJson(),
        'icon': s.icon,
        'showOnHome': s.showOnHome,
      },
  ],
  'concerns': [
    for (final c in config.concerns)
      {
        'id': c.id,
        'labels': c.labels.toJson(),
        'icon': c.icon,
        'tone': c.tone,
        'specialtyCodes': c.specialtyCodes,
      },
  ],
  'settings': config.settings,
});
