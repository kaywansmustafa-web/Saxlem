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
  });
}
