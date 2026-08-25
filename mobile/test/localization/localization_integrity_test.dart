import 'dart:convert';
import 'dart:io';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('all locale resources have matching messages and valid UTF-8', () {
    final files = [
      'app_en.arb',
      'app_ar.arb',
      'app_ku.arb',
    ].map((name) => File('lib/l10n/$name')).toList();
    final maps = files.map((file) {
      final bytes = file.readAsBytesSync();
      final source = utf8.decode(bytes, allowMalformed: false);
      expect(source, isNot(matches(RegExp(r'[ÂÃ�]|â€'))));
      return jsonDecode(source) as Map<String, dynamic>;
    }).toList();
    final expected = maps.first.keys
        .where((key) => !key.startsWith('@'))
        .toSet();
    for (final map in maps.skip(1)) {
      expect(map.keys.where((key) => !key.startsWith('@')).toSet(), expected);
    }

    final english = maps[0];
    final arabic = maps[1];
    final badini = maps[2];
    for (final key in expected) {
      final englishValue = english[key] as String;
      final arabicValue = arabic[key] as String;
      final badiniValue = badini[key] as String;
      if (key != 'appName') {
        expect(
          arabicValue,
          isNot(englishValue),
          reason: 'Arabic fallback: $key',
        );
        expect(
          badiniValue,
          isNot(englishValue),
          reason: 'Badini fallback: $key',
        );
      }
      expect(arabicValue, isNot(contains('????')));
      expect(badiniValue, isNot(contains('????')));
      final badiniPresentationText = badiniValue
          .replaceAll(
            RegExp(r'\{[A-Za-z_][A-Za-z0-9_]*(?:,\s*(?:select|plural))?'),
            '',
          )
          .replaceAll(
            RegExp(
              r'\b(?:select|plural|other|zero|one|two|few|many|male|female|mother|father|wife|husband|son|daughter|brother|sister|grandfather|grandmother|me)\b',
            ),
            '',
          );
      expect(
        badiniPresentationText,
        isNot(matches(RegExp('[A-Za-z]'))),
        reason: 'Latin-script Badini leakage: $key',
      );
    }

    expect(arabic['doctorProfile'], 'ملف الطبيب');
    expect(arabic['appointments'], 'المواعيد');
    expect(arabic['liveQueue'], 'قائمة الانتظار المباشرة');
    expect(badini['doctorProfile'], 'پروفایلێ نوژداری');
    expect(badini['appointments'], 'ژڤان');
    expect(badini['liveQueue'], 'رێزبەندییا زندی');
  });
}
