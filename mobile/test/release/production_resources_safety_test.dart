import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('production localization resources contain no development OTP', () {
    const developmentOtp = '123456';
    final resources = Directory(
      'lib/l10n',
    ).listSync().whereType<File>().where((file) => file.path.endsWith('.arb'));

    for (final resource in resources) {
      expect(
        resource.readAsStringSync(),
        isNot(contains(developmentOtp)),
        reason: '${resource.path} must not expose the development OTP.',
      );
    }
  });
}
