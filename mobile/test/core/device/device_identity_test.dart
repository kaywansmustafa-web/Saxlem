import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/core/device/device_identity.dart';

import '../../helpers/memory_secure_store.dart';

void main() {
  test('generates once, persists, and reuses the stable identifier', () async {
    final store = MemorySecureStore();
    final first = SecureDeviceIdentity(store, random: Random(1));
    final identifier = await first.identifier();
    final restored = SecureDeviceIdentity(store, random: Random(2));

    expect(await first.identifier(), identifier);
    expect(await restored.identifier(), identifier);
    expect(store.writes, 1);
    expect(identifier, matches(RegExp(r'^[0-9a-f-]{36}$')));
  });

  test('corrupted identifier regenerates safely', () async {
    final store = MemorySecureStore()
      ..values[SecureDeviceIdentity.storageKey] = 'corrupted';
    final identity = SecureDeviceIdentity(store, random: Random(1));

    expect(await identity.identifier(), isNot('corrupted'));
    expect(store.writes, 1);
  });

  test('maps backend-supported platform values', () {
    expect(
      SecureDeviceIdentity(
        MemorySecureStore(),
        targetPlatform: TargetPlatform.android,
        web: false,
      ).platform,
      'android',
    );
    expect(
      SecureDeviceIdentity(
        MemorySecureStore(),
        targetPlatform: TargetPlatform.iOS,
        web: false,
      ).platform,
      'ios',
    );
    expect(
      SecureDeviceIdentity(MemorySecureStore(), web: true).platform,
      'web',
    );
    expect(
      SecureDeviceIdentity(
        MemorySecureStore(),
        targetPlatform: TargetPlatform.windows,
        web: false,
      ).platform,
      'desktop',
    );
  });
}
