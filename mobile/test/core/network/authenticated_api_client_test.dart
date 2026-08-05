import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:saxlem_app/config/environment/app_configuration.dart';
import 'package:saxlem_app/core/network/api_client.dart';
import 'package:saxlem_app/core/network/api_failure.dart';
import 'package:saxlem_app/core/network/authenticated_api_client.dart';
import 'package:saxlem_app/core/network/refresh_coordinator.dart';
import 'package:saxlem_app/features/authentication/domain/repositories/auth_repository.dart';

void main() {
  test(
    'safe GET retries once after coordinated refresh is persisted',
    () async {
      final configuration = AppConfiguration.fromValues(
        environment: 'production',
        apiBaseUrl: 'https://api.saxlem.test',
      );
      final storage = _MemoryStorage(_session('old'));
      final authorizations = <String?>[];
      var requests = 0;
      final api = ApiClient(
        configuration: configuration,
        client: MockClient((request) async {
          requests++;
          authorizations.add(request.headers['authorization']);
          if (requests == 1) {
            return http.Response(
              jsonEncode({
                'error': {
                  'code': 'REQUEST_REJECTED',
                  'message': 'The request could not be completed.',
                  'requestId': 'request-1',
                  'retryable': false,
                  'fieldErrors': <Object>[],
                },
              }),
              401,
            );
          }
          return http.Response('{"ok":true}', 200);
        }),
      );
      final client = AuthenticatedApiClient(
        api: api,
        storage: storage,
        refresh: () async {
          final replacement = _session('new');
          await storage.write(replacement);
          return replacement;
        },
      );

      expect((await client.getJson('patients/me')).body, {'ok': true});
      expect(requests, 2);
      expect(authorizations, ['Bearer old-access', 'Bearer new-access']);
      expect(storage.value.accessToken, 'new-access');
    },
  );

  test(
    'concurrent GET failures share the auth-owned refresh without deadlock',
    () async {
      final configuration = AppConfiguration.fromValues(
        environment: 'production',
        apiBaseUrl: 'https://api.saxlem.test',
      );
      final storage = _MemoryStorage(_session('old'));
      final coordinator = RefreshCoordinator<StoredSession>();
      var refreshes = 0;
      final api = ApiClient(
        configuration: configuration,
        client: MockClient((request) async {
          if (request.headers['authorization'] == 'Bearer old-access') {
            return http.Response(
              jsonEncode({
                'error': {
                  'code': 'UNAUTHENTICATED',
                  'message': 'Unauthenticated',
                  'requestId': 'request-1',
                  'retryable': false,
                  'fieldErrors': <Object>[],
                },
              }),
              401,
            );
          }
          return http.Response('{"ok":true}', 200);
        }),
      );
      final client = AuthenticatedApiClient(
        api: api,
        storage: storage,
        refresh: () => coordinator.run(() async {
          refreshes++;
          await Future<void>.delayed(Duration.zero);
          final replacement = _session('new');
          await storage.write(replacement);
          return replacement;
        }),
      );

      final results = await Future.wait([
        client.getJson('patients/me'),
        client.getJson('patients/me'),
      ]);
      expect(results.map((result) => result.body), everyElement({'ok': true}));
      expect(refreshes, 1);
    },
  );

  test(
    'a second unauthorized response clears the rotated local session',
    () async {
      final configuration = AppConfiguration.fromValues(
        environment: 'production',
        apiBaseUrl: 'https://api.saxlem.test',
      );
      final storage = _MemoryStorage(_session('old'));
      final api = ApiClient(
        configuration: configuration,
        client: MockClient(
          (_) async => http.Response(
            jsonEncode({
              'error': {
                'code': 'UNAUTHENTICATED',
                'message': 'Unauthenticated',
                'requestId': 'request-1',
                'retryable': false,
                'fieldErrors': <Object>[],
              },
            }),
            401,
          ),
        ),
      );
      final client = AuthenticatedApiClient(
        api: api,
        storage: storage,
        refresh: () async {
          final replacement = _session('new');
          await storage.write(replacement);
          return replacement;
        },
      );

      await expectLater(
        client.getJson('patients/me'),
        throwsA(isA<ApiFailure>()),
      );
      expect(storage.cleared, isTrue);
    },
  );
}

StoredSession _session(String prefix) => StoredSession(
  phoneNumber: '+9647500000000',
  expiresAt: DateTime.utc(2030),
  accessToken: '$prefix-access',
  refreshToken: '$prefix-refresh',
  deviceId: '00000000-0000-4000-8000-000000000001',
);

class _MemoryStorage implements SessionStorage {
  _MemoryStorage(this.value);
  StoredSession value;
  bool cleared = false;

  @override
  Future<void> clear() async => cleared = true;

  @override
  Future<StoredSession?> read() async => value;

  @override
  Future<void> write(StoredSession session) async => value = session;
}
