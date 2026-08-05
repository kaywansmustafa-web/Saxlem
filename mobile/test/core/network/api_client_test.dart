import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:saxlem_app/config/environment/app_configuration.dart';
import 'package:saxlem_app/core/network/api_client.dart';
import 'package:saxlem_app/core/network/api_failure.dart';

void main() {
  final configuration = AppConfiguration.fromValues(
    environment: 'production',
    apiBaseUrl: 'https://api.saxlem.test',
    apiTimeoutSeconds: '1',
  );

  test(
    'uses configured base URL, JSON, bearer token, and request ID',
    () async {
      late http.Request captured;
      final api = ApiClient(
        configuration: configuration,
        client: MockClient((request) async {
          captured = request;
          return http.Response(
            '{"ok":true}',
            200,
            headers: {'x-request-id': 'request-1'},
          );
        }),
      );

      final response = await api.postJson(
        'auth/refresh',
        body: {'value': 'redacted'},
        bearerToken: 'fake-access-token',
      );

      expect(
        captured.url.toString(),
        'https://api.saxlem.test/api/v1/auth/refresh',
      );
      expect(captured.headers['content-type'], 'application/json');
      expect(captured.headers['authorization'], 'Bearer fake-access-token');
      expect(captured.followRedirects, isFalse);
      expect(captured.maxRedirects, 0);
      expect(response.body, {'ok': true});
      expect(response.requestId, 'request-1');
    },
  );

  test('strictly rejects invalid JSON responses', () async {
    final api = ApiClient(
      configuration: configuration,
      client: MockClient((_) async => http.Response('not-json', 200)),
    );
    await expectLater(
      api.getJson('patients/me'),
      throwsA(
        isA<ApiFailure>().having(
          (failure) => failure.type,
          'type',
          ApiFailureType.malformedResponse,
        ),
      ),
    );
  });

  test('rejects oversized response bodies', () async {
    final api = ApiClient(
      configuration: configuration,
      client: MockClient(
        (_) async => http.Response(
          List.filled(ApiClient.maximumResponseBytes + 1, 'x').join(),
          200,
        ),
      ),
    );
    await expectLater(
      api.getJson('patients/me'),
      throwsA(
        isA<ApiFailure>().having(
          (failure) => failure.type,
          'type',
          ApiFailureType.malformedResponse,
        ),
      ),
    );
  });

  test(
    'parses the standard backend error envelope without sensitive body data',
    () async {
      final api = ApiClient(
        configuration: configuration,
        client: MockClient(
          (_) async => http.Response(
            '{"error":{"code":"REQUEST_REJECTED","message":"safe",'
            '"requestId":"request-2","retryable":false,"fieldErrors":[]},'
            '"refreshToken":"must-not-escape"}',
            401,
          ),
        ),
      );
      try {
        await api.getJson('patients/me');
        fail('Expected an API failure.');
      } on ApiFailure catch (failure) {
        expect(failure.type, ApiFailureType.unauthenticated);
        expect(failure.requestId, 'request-2');
        expect(failure.toString(), isNot(contains('must-not-escape')));
        expect(failure.toString(), isNot(contains('safe')));
      }
    },
  );

  test('classifies timeout and client/socket failures', () async {
    final timeoutApi = ApiClient(
      configuration: configuration,
      client: MockClient((_) => Completer<http.Response>().future),
    );
    await expectLater(
      timeoutApi.getJson('patients/me'),
      throwsA(
        isA<ApiFailure>().having(
          (failure) => failure.type,
          'type',
          ApiFailureType.timeout,
        ),
      ),
    );

    final offlineApi = ApiClient(
      configuration: configuration,
      client: MockClient((_) async => throw http.ClientException('socket')),
    );
    await expectLater(
      offlineApi.getJson('patients/me'),
      throwsA(
        isA<ApiFailure>().having(
          (failure) => failure.type,
          'type',
          ApiFailureType.offline,
        ),
      ),
    );
  });

  test('classifies required HTTP status codes', () async {
    const expected = {
      400: ApiFailureType.validation,
      401: ApiFailureType.unauthenticated,
      403: ApiFailureType.forbidden,
      404: ApiFailureType.notFound,
      409: ApiFailureType.conflict,
      429: ApiFailureType.rateLimited,
      500: ApiFailureType.server,
      503: ApiFailureType.unavailable,
    };
    for (final entry in expected.entries) {
      final api = ApiClient(
        configuration: configuration,
        client: MockClient(
          (_) async => http.Response(
            '{"error":{"code":"REQUEST_REJECTED","message":"safe",'
            '"requestId":"request","retryable":false,"fieldErrors":[]}}',
            entry.key,
          ),
        ),
      );
      await expectLater(
        api.getJson('patients/me'),
        throwsA(
          isA<ApiFailure>().having(
            (failure) => failure.type,
            'type',
            entry.value,
          ),
        ),
      );
    }
  });
}
