import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:saxlem_app/config/environment/app_configuration.dart';
import 'package:saxlem_app/features/authentication/domain/repositories/auth_repository.dart';
import 'package:saxlem_app/features/notifications/data/stream/authenticated_notification_sse_transport.dart';

void main() {
  test('uses bearer and Last-Event-ID headers without URL tokens', () async {
    late http.Request captured;
    final client = MockClient((request) async {
      captured = request;
      return http.Response(
        'id: 42\nevent: notification\ndata: {"id":"11111111-1111-4111-8111-111111111111","patientProfileId":null,"deliverySequence":"42","type":"queue.patient.called","priority":"high","actionCode":"queue.patient.called","occurredAt":"2026-08-10T06:00:00Z","createdAt":"2026-08-10T06:00:01Z","readAt":null}\n\n',
        200,
        headers: {'content-type': 'text/event-stream'},
      );
    });
    final transport = AuthenticatedNotificationSseTransport(
      configuration: AppConfiguration.fromValues(
        environment: 'production',
        apiBaseUrl: 'https://api.saxlem.test',
      ),
      storage: _Storage(),
      refresh: () async => _session,
      client: client,
    );
    final signal = await transport.open(lastEventId: '41').first;
    expect(signal.deliverySequence, '42');
    expect(captured.headers['authorization'], 'Bearer access-secret');
    expect(captured.headers['last-event-id'], '41');
    expect(captured.url.query, isEmpty);
    transport.close();
  });
}

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
