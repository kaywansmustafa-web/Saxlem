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
    const approvedLocaleInvariantValues = {
      'appName',
      'phoneHint',
      'tabWithCount',
    };
    for (final key in expected) {
      final englishValue = english[key] as String;
      final arabicValue = arabic[key] as String;
      final badiniValue = badini[key] as String;
      if (!approvedLocaleInvariantValues.contains(key)) {
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
      // FIB (First Iraqi Bank) and QR are written as in the FIB app itself.
      final badiniPresentationText = badiniValue
          .replaceAll(RegExp(r'\b(?:FIB|QR)\b'), '')
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
    expect(badini['doctorProfile'], 'پڕۆفایلا نوژداری');
    expect(badini['appointments'], 'ژڤان');
    expect(badini['liveQueue'], 'ڕێزبەندییا زندی');
  });

  test('Badini copy keeps Sorani words and the old spellings out', () {
    final badini =
        jsonDecode(File('lib/l10n/app_ku.arb').readAsStringSync())
            as Map<String, dynamic>;
    // Sorani forms with a Badini word of their own, and spellings the
    // founder replaced (docs/localization/approved-terminology.md).
    const banned = {
      'ڵ': 'Badini writes ل',
      'تکایە': 'هیڤییە',
      'هەوڵ': 'هەول',
      'ڕاستەوخۆ': 'زندی',
      'پزیشک': 'نوژدار',
      'وەسل': 'پسوولە',
      'ئێستا': 'نوکە',
      'بەکارهێنان': 'بکارئینان',
      'وردەکاری': 'هویرکاری',
    };
    // Arabic-script letters only, so punctuation such as ، still ends a word.
    const letter = r'[\u0621-\u064A\u0671-\u06D3\u06D5]';
    final soraniSuffix = RegExp('$letterەکان(?!$letter)');
    final soraniSelf = RegExp('(?<!$letter)خۆ(?!$letter)');
    for (final entry in badini.entries) {
      if (entry.key.startsWith('@') || entry.value is! String) continue;
      final text = entry.value as String;
      for (final word in banned.entries) {
        expect(
          text.contains(word.key),
          isFalse,
          reason: '${entry.key}: use ${word.value} instead of ${word.key}',
        );
      }
      expect(soraniSuffix.hasMatch(text), isFalse, reason: entry.key);
      expect(soraniSelf.hasMatch(text), isFalse, reason: '${entry.key}: خو');
      expect(
        RegExp('[٠-٩]').hasMatch(text),
        isFalse,
        reason: '${entry.key}: the app shows Western digits',
      );
    }
  });

  test('translations keep every simple placeholder of the English message', () {
    Map<String, dynamic> read(String name) =>
        jsonDecode(File('lib/l10n/$name').readAsStringSync())
            as Map<String, dynamic>;
    final english = read('app_en.arb');
    final placeholder = RegExp(r'\{(\w+)\}');
    for (final name in ['app_ar.arb', 'app_ku.arb']) {
      final translated = read(name);
      for (final entry in english.entries) {
        if (entry.key.startsWith('@') || entry.value is! String) continue;
        final source = entry.value as String;
        if (source.contains(', select,') || source.contains(', plural,')) {
          continue;
        }
        for (final match in placeholder.allMatches(source)) {
          expect(
            (translated[entry.key] as String).contains('{${match.group(1)}}'),
            isTrue,
            reason: '$name ${entry.key} lost {${match.group(1)}}',
          );
        }
      }
    }
  });
}
