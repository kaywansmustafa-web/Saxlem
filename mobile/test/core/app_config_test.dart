import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/core/app_config/app_config.dart';
import 'package:saxlem_app/core/app_config/app_config_store.dart';
import 'package:flutter/widgets.dart';

const _json = {
  'specialties': [
    {
      'code': 'pediatrics',
      'names': {'en': 'Pediatrics', 'ar': 'طب الأطفال', 'ku': 'زارۆک'},
      'icon': 'child',
      'showOnHome': true,
    },
  ],
  'concerns': [
    {
      'id': '0198d38e-5862-7000-8000-000000000001',
      'labels': {
        'en': 'My child is sick',
        'ar': 'طفلي مريض',
        'ku': 'زارۆکێ من نەخۆشە',
      },
      'icon': 'child',
      'tone': 'sparkly',
      'specialtyCodes': ['pediatrics'],
    },
  ],
  'settings': {
    'contact.emergencyNumber': '115',
    'booking.daysAhead': 21,
    'features.reviews': false,
    'home.freeToday': false,
  },
};

class _Failing implements AppConfigRepository {
  int calls = 0;
  @override
  Future<AppConfig> fetch() async {
    calls++;
    throw Exception('offline');
  }
}

void main() {
  test('reads the Owner Portal catalog and settings', () {
    final config = const AppConfigParser().parse(_json);
    expect(config.fromServer, isTrue);
    expect(config.emergencyNumber, '115');
    expect(config.bookingDaysAhead, 21);
    expect(config.reviewsOn, isFalse);
    expect(config.home('freeToday'), isFalse);
    expect(config.home('concerns'), isTrue);
    // An unknown colour from a newer server is drawn blue.
    expect(config.concerns.single.tone, 'blue');
    expect(
      config.specialtyName('pediatrics', const Locale('ku'), 'Pediatrics'),
      'زارۆک',
    );
    expect(
      config.localizedSpecialty('Pediatrics', const Locale('ar')),
      'طب الأطفال',
    );
    expect(config.localizedSpecialty('Surgery', const Locale('ar')), 'Surgery');
  });

  test('built-in values are the ones Saxlem shipped with', () {
    const config = AppConfig.builtIn;
    expect(config.emergencyNumber, '122');
    expect(config.bookingDaysAhead, 14);
    expect(config.reviewCommentMax, 500);
    expect(config.earlierTimeMinLeadHours, 3);
    expect(
      config.reviewsOn && config.leaveByOn && config.home('emergency'),
      isTrue,
    );
  });

  test('refuses a malformed answer whole', () {
    final parser = const AppConfigParser();
    expect(
      () => parser.parse({
        ..._json,
        'settings': {'bad key': 1},
      }),
      throwsFormatException,
    );
    expect(
      () => parser.parse({
        ..._json,
        'specialties': [
          {
            'code': 'Bad Code',
            'names': {},
            'icon': 'child',
            'showOnHome': true,
          },
        ],
      }),
      throwsFormatException,
    );
    expect(() => parser.parse({'specialties': []}), throwsFormatException);
  });

  test(
    'keeps the last good copy when offline, and uses it at the next start',
    () async {
      final cache = MemoryAppConfigCache();
      final online = AppConfigController(
        repository: BuiltInAppConfigRepository(
          const AppConfigParser().parse(_json),
        ),
        cache: cache,
      );
      await online.load();
      expect(online.config.emergencyNumber, '115');

      final failing = _Failing();
      final offline = AppConfigController(repository: failing, cache: cache);
      await offline.load();
      expect(failing.calls, 1);
      expect(offline.config.emergencyNumber, '115');
      // Resuming soon after a failure tries again; a success is reused 5 min.
      await offline.refresh();
      expect(failing.calls, 2);
      final round = const AppConfigParser().parse(
        jsonDecode(encodeAppConfig(online.config)),
      );
      expect(round.concerns.single.labels.ku, 'زارۆکێ من نەخۆشە');
    },
  );
}
