import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:saxlem_app/config/environment/app_configuration.dart';
import 'package:saxlem_app/core/network/api_client.dart';
import 'package:saxlem_app/core/network/authenticated_api_client.dart';
import 'package:saxlem_app/features/authentication/domain/repositories/auth_repository.dart';
import 'package:saxlem_app/features/notifications/data/repositories/backend_notifications_repository.dart';
import 'package:saxlem_app/features/notifications/data/stream/authenticated_notification_sse_transport.dart';
import 'package:saxlem_app/features/notifications/domain/entities/patient_notification.dart';

void main() {
  test('lists with exact cursor and marks read with idempotency', () async {
    final requests = <http.Request>[];
    final client = MockClient((request) async {
      requests.add(request);
      if (request.method == 'GET')
        return http.Response(
          jsonEncode({
            'items': [_item(readAt: null)],
            'nextCursor': 'next-cursor',
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      return http.Response(
        jsonEncode({'notification': _item(readAt: '2026-08-10T06:01:00Z')}),
        200,
        headers: {'content-type': 'application/json'},
      );
    });
    final config = AppConfiguration.fromValues(
      environment: 'production',
      apiBaseUrl: 'https://api.saxlem.test',
    );
    final storage = _Storage();
    final api = AuthenticatedApiClient(
      api: ApiClient(configuration: config, client: client),
      storage: storage,
      refresh: () async => _session,
    );
    final repository = BackendNotificationsRepository(
      api,
      AuthenticatedNotificationSseTransport(
        configuration: config,
        storage: storage,
        refresh: () async => _session,
        client: MockClient((_) async => http.Response('', 503)),
      ),
    );
    final page = await repository.list(cursor: 'opaque-cursor');
    expect(page.nextCursor, 'next-cursor');
    expect(requests.first.url.path, '/api/v1/notifications');
    expect(requests.first.url.queryParameters, {
      'pageSize': '25',
      'unreadOnly': 'false',
      'cursor': 'opaque-cursor',
    });
    final read = await repository.markNotificationRead(
      const NotificationId('11111111-1111-4111-8111-111111111111'),
    );
    expect(read.isUnread, isFalse);
    expect(requests.last.method, 'POST');
    expect(
      requests.last.url.path,
      '/api/v1/notifications/11111111-1111-4111-8111-111111111111/read',
    );
    expect(
      requests.last.headers['idempotency-key'],
      matches(RegExp(r'^notification-[0-9a-f]{48}$')),
    );
    expect(requests.last.body, '{}');
    await repository.dispose();
  });
}

Map<String, Object?> _item({required String? readAt}) => {
  'id': '11111111-1111-4111-8111-111111111111',
  'patientProfileId': null,
  'deliverySequence': '42',
  'type': 'queue.patient.called',
  'priority': 'high',
  'actionCode': 'queue.patient.called',
  'occurredAt': '2026-08-10T06:00:00Z',
  'createdAt': '2026-08-10T06:00:01Z',
  'readAt': readAt,
};
final _session = StoredSession(
  phoneNumber: 'redacted',
  expiresAt: DateTime.now().toUtc().add(const Duration(hours: 1)),
  accessToken: 'access-secret',
  refreshToken: 'refresh-secret',
  deviceId: 'device',
);

class _Storage implements SessionStorage {
  @override
  Future<void> clear() async {}
  @override
  Future<StoredSession?> read() async => _session;
  @override
  Future<void> write(StoredSession session) async {}
}

// ignore_for_file: curly_braces_in_flow_control_structures
