import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/features/notifications/data/stream/notification_sse_parser.dart';

void main() {
  const data =
      '{"id":"11111111-1111-4111-8111-111111111111","patientProfileId":null,"deliverySequence":"42","type":"queue.patient.called","priority":"high","actionCode":"queue.patient.called","occurredAt":"2026-08-10T06:00:00Z","createdAt":"2026-08-10T06:00:01Z","readAt":null}';
  test('parses notification frame and ignores heartbeat', () async {
    final stream = Stream.value(
      utf8.encode(
        ': heartbeat\n\nid: 42\nevent: notification\ndata: $data\n\n',
      ),
    );
    final values = await const NotificationSseParser().parse(stream).toList();
    expect(values.single.deliverySequence, '42');
  });
  test('rejects malformed or mismatched event id', () async {
    for (final id in ['bad', '41']) {
      final stream = Stream.value(
        utf8.encode('id: $id\nevent: notification\ndata: $data\n\n'),
      );
      expect(
        const NotificationSseParser().parse(stream).toList(),
        throwsA(anything),
      );
    }
  });
  test('rejects oversized line', () async {
    final oversized = List.filled(9000, 'x').join();
    final stream = Stream.value(utf8.encode('data: $oversized\n\n'));
    expect(
      const NotificationSseParser().parse(stream).toList(),
      throwsA(anything),
    );
  });
}
