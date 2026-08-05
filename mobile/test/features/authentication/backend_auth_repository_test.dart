import 'dart:async';
import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:saxlem_app/config/environment/app_configuration.dart';
import 'package:saxlem_app/config/environment/app_environment.dart';
import 'package:saxlem_app/core/device/device_identity.dart';
import 'package:saxlem_app/core/network/api_client.dart';
import 'package:saxlem_app/features/authentication/data/repositories/backend_auth_repository.dart';
import 'package:saxlem_app/features/authentication/domain/entities/auth_session.dart';
import 'package:saxlem_app/features/authentication/domain/entities/phone_number.dart';
import 'package:saxlem_app/features/authentication/domain/repositories/auth_repository.dart';

void main() {
  final configuration = AppConfiguration.fromValues(
    environment: 'production',
    apiBaseUrl: 'https://api.saxlem.test',
  );
  final now = DateTime.utc(2026, 8, 5, 10);
  const deviceId = '00000000-0000-4000-8000-000000000001';
  const phone = '+9647500000000';

  BackendAuthRepository repository(
    Future<http.Response> Function(http.Request) handler,
    MemorySessionStorage storage, {
    AppEnvironment environment = AppEnvironment.production,
  }) => BackendAuthRepository(
    api: ApiClient(configuration: configuration, client: MockClient(handler)),
    storage: storage,
    deviceIdentity: const _FakeDeviceIdentity(deviceId),
    environment: environment,
    now: () => now,
  );

  test('request OTP maps the documented challenge contract', () async {
    late Map<String, dynamic> requestBody;
    final auth = repository((request) async {
      requestBody = jsonDecode(request.body) as Map<String, dynamic>;
      return http.Response(
        '{"challengeId":"00000000-0000-4000-8000-000000000002",'
        '"expiresAt":"2026-08-05T10:05:00.000Z"}',
        202,
      );
    }, MemorySessionStorage());

    final challenge = await auth.requestOtp(
      PhoneNumber.parseIraq('07500000000')!,
    );
    expect(requestBody, {'phone': phone});
    expect(challenge.id, '00000000-0000-4000-8000-000000000002');
    expect(challenge.maskedDestination, '+964 ••• ••• 000');
  });

  test('development OTP is retained only in development', () async {
    Future<http.Response> handler(_) async => http.Response(
      '{"challengeId":"00000000-0000-4000-8000-000000000002",'
      '"expiresAt":"2026-08-05T10:05:00.000Z","developmentOtp":"123456"}',
      202,
    );
    final production = repository(handler, MemorySessionStorage());
    final development = repository(
      handler,
      MemorySessionStorage(),
      environment: AppEnvironment.development,
    );

    await expectLater(
      production.requestOtp(PhoneNumber.parseIraq('07500000000')!),
      throwsA(isA<Exception>()),
    );
    expect(
      (await development.requestOtp(
        PhoneNumber.parseIraq('07500000000')!,
      )).developmentOtp,
      '123456',
    );
  });

  test(
    'verify OTP sends device binding and persists a complete session',
    () async {
      final storage = MemorySessionStorage();
      final requests = <http.Request>[];
      final auth = repository((request) async {
        requests.add(request);
        if (request.url.path.endsWith('request-otp')) {
          return http.Response(
            '{"challengeId":"00000000-0000-4000-8000-000000000002",'
            '"expiresAt":"2026-08-05T10:05:00.000Z"}',
            202,
          );
        }
        return http.Response(_tokens('a', 'r'), 200);
      }, storage);
      final challenge = await auth.requestOtp(
        PhoneNumber.parseIraq('07500000000')!,
      );
      final session = await auth.verifyOtp(
        challengeId: challenge.id,
        code: '123456',
      );
      final verifyBody = jsonDecode(requests.last.body) as Map<String, dynamic>;

      expect(verifyBody['deviceId'], deviceId);
      expect(verifyBody['platform'], 'android');
      expect(verifyBody['otp'], '123456');
      expect(session.status, AuthSessionStatus.authenticated);
      expect(session.userId, isNull);
      expect(storage.value?.accessToken, _token('a'));
      expect(storage.value?.refreshToken, _token('r'));
      expect(storage.value?.expiresAt, now.add(const Duration(minutes: 10)));
    },
  );

  test(
    'expired session refresh rotates and atomically replaces tokens',
    () async {
      final storage = MemorySessionStorage()
        ..value = _stored(now.subtract(const Duration(seconds: 1)));
      var refreshCalls = 0;
      final auth = repository((request) async {
        refreshCalls++;
        return http.Response(_tokens('n', 't'), 200);
      }, storage);

      final restored = await auth.restoreSession();
      expect(restored.status, AuthSessionStatus.authenticated);
      expect(refreshCalls, 1);
      expect(storage.value?.accessToken, _token('n'));
      expect(storage.value?.refreshToken, _token('t'));
      expect(storage.writes, 1);
    },
  );

  test('device-binding mismatch fails closed and clears the session', () async {
    final storage = MemorySessionStorage()
      ..value = StoredSession(
        phoneNumber: phone,
        expiresAt: now.add(const Duration(minutes: 5)),
        accessToken: _token('a'),
        refreshToken: _token('r'),
        deviceId: '00000000-0000-4000-8000-000000000099',
      );
    final auth = repository(
      (_) async => fail('The backend must not be called.'),
      storage,
    );

    expect(
      (await auth.restoreSession()).status,
      AuthSessionStatus.sessionExpired,
    );
    expect(storage.value, isNull);
  });

  test(
    'logout and logout-all clear locally when backend is unreachable',
    () async {
      for (final all in [false, true]) {
        final storage = MemorySessionStorage()..value = _stored(now);
        final auth = repository(
          (_) async => throw http.ClientException('offline'),
          storage,
        );
        if (all) {
          await auth.logoutAll();
        } else {
          await auth.logout();
        }
        expect(storage.value, isNull);
      }
    },
  );

  test('terminal refresh failure clears credentials', () async {
    final storage = MemorySessionStorage()
      ..value = _stored(now.subtract(const Duration(seconds: 1)));
    final auth = repository(
      (_) async => http.Response(_errorEnvelope(), 401),
      storage,
    );

    expect(
      (await auth.restoreSession()).status,
      AuthSessionStatus.sessionExpired,
    );
    expect(storage.value, isNull);
  });

  test('temporary refresh failure preserves credentials', () async {
    final stored = _stored(now.subtract(const Duration(seconds: 1)));
    final storage = MemorySessionStorage()..value = stored;
    final auth = repository(
      (_) async => throw http.ClientException('offline'),
      storage,
    );

    expect(
      (await auth.restoreSession()).status,
      AuthSessionStatus.restorationUnavailable,
    );
    expect(storage.value, same(stored));
  });

  test('rate-limited refresh preserves credentials', () async {
    final stored = _stored(now.subtract(const Duration(seconds: 1)));
    final storage = MemorySessionStorage()..value = stored;
    final auth = repository(
      (_) async => http.Response(_errorEnvelope(), 429),
      storage,
    );

    expect(
      (await auth.restoreSession()).status,
      AuthSessionStatus.restorationUnavailable,
    );
    expect(storage.value, same(stored));
  });

  test('concurrent refresh callers produce one rotation request', () async {
    final storage = MemorySessionStorage()..value = _stored(now);
    final gate = Completer<void>();
    var calls = 0;
    final auth = repository((_) async {
      calls++;
      await gate.future;
      return http.Response(_tokens('n', 't'), 200);
    }, storage);

    final first = auth.refreshSession();
    final second = auth.refreshSession();
    final third = auth.refreshSession();
    await Future<void>.delayed(Duration.zero);
    expect(calls, 1);
    gate.complete();

    final results = await Future.wait([first, second, third]);
    expect(results.map((item) => item.refreshToken).toSet(), {_token('t')});
    expect(calls, 1);
  });
}

String _tokens(String accessCharacter, String refreshCharacter) => jsonEncode({
  'accessToken': _token(accessCharacter),
  'refreshToken': _token(refreshCharacter),
  'expiresInSeconds': 600,
});

String _errorEnvelope() => jsonEncode({
  'error': {
    'code': 'REQUEST_REJECTED',
    'message': 'The request could not be completed.',
    'requestId': 'request-1',
    'retryable': false,
    'fieldErrors': <Object>[],
  },
});

StoredSession _stored(DateTime expiry) => StoredSession(
  phoneNumber: '+9647500000000',
  expiresAt: expiry,
  accessToken: _token('a'),
  refreshToken: _token('r'),
  deviceId: '00000000-0000-4000-8000-000000000001',
);

String _token(String character) => List.filled(40, character).join();

class MemorySessionStorage implements SessionStorage {
  StoredSession? value;
  int writes = 0;

  @override
  Future<void> clear() async => value = null;

  @override
  Future<StoredSession?> read() async => value;

  @override
  Future<void> write(StoredSession session) async {
    writes++;
    value = session;
  }
}

class _FakeDeviceIdentity implements DeviceIdentity {
  const _FakeDeviceIdentity(this.value);
  final String value;

  @override
  Future<String> identifier() async => value;

  @override
  String get platform => 'android';
}
