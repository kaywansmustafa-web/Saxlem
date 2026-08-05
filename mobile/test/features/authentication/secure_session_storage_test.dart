import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/features/authentication/data/storage/secure_session_storage.dart';
import 'package:saxlem_app/features/authentication/domain/repositories/auth_repository.dart';

import '../../helpers/memory_secure_store.dart';

void main() {
  late MemorySecureStore store;
  late SecureSessionStorage storage;

  setUp(() {
    store = MemorySecureStore();
    storage = SecureSessionStorage(store);
  });

  StoredSession session({String? access, String? refresh}) => StoredSession(
    phoneNumber: '+9647500000000',
    expiresAt: DateTime.utc(2030),
    accessToken: access ?? _token('a'),
    refreshToken: refresh ?? _token('r'),
    deviceId: '00000000-0000-4000-8000-000000000001',
  );

  test('round trips one versioned secure record', () async {
    await storage.write(session());
    final restored = await storage.read();

    expect(store.values.keys, contains(SecureSessionStorage.sessionKey));
    expect(restored?.accessToken, _token('a'));
    expect(restored?.refreshToken, _token('r'));
    expect(restored?.expiresAt, DateTime.utc(2030));
  });

  test('atomically replaces the serialized logical record', () async {
    await storage.write(session(refresh: _token('r')));
    await storage.write(session(refresh: _token('n')));

    expect(store.values.length, 1);
    expect((await storage.read())?.refreshToken, _token('n'));
  });

  test(
    'rejects unsupported versions, malformed JSON, and missing fields',
    () async {
      for (final value in [
        '{',
        jsonEncode({'version': 2}),
        jsonEncode({'version': 1, 'kind': 'backend'}),
      ]) {
        store.values[SecureSessionStorage.sessionKey] = value;
        await expectLater(
          storage.read(),
          throwsA(isA<SessionStorageException>()),
        );
      }
    },
  );

  test('clear removes record and legacy mock keys', () async {
    store.values.addAll({
      SecureSessionStorage.sessionKey: '{}',
      'auth.user_id': 'legacy',
      'auth.phone': 'legacy',
      'auth.expires_at': 'legacy',
    });
    await storage.clear();
    expect(store.values, isEmpty);
  });

  test('read clears legacy partial state instead of preserving it', () async {
    store.values.addAll({
      'auth.user_id': 'legacy',
      'auth.phone': '+9647500000000',
    });
    expect(await storage.read(), isNull);
    expect(store.values, isEmpty);
  });

  test('storage exceptions never include token values', () async {
    const secret = 'fake-secret-token-that-must-not-leak';
    store.values[SecureSessionStorage.sessionKey] = jsonEncode({
      'version': 1,
      'kind': 'backend',
      'accessToken': secret,
    });
    try {
      await storage.read();
      fail('Expected malformed storage.');
    } on SessionStorageException catch (error) {
      expect(error.toString(), isNot(contains(secret)));
    }
  });
}

String _token(String character) => List.filled(40, character).join();
