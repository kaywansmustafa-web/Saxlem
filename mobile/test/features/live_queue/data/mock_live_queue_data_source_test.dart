import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/features/live_queue/data/data_sources/mock_live_queue_data_source.dart';

void main() {
  test('simulates versioned queue progress and disposes safely', () async {
    final source = MockLiveQueueDataSource(
      updateInterval: const Duration(milliseconds: 10),
    );
    final snapshots = source
        .watch('entry-1')
        .where((event) => event is MockSnapshotEvent)
        .cast<MockSnapshotEvent>()
        .map((event) => event.snapshot)
        .take(2);

    final values = await snapshots.toList();
    expect(values.last.queueVersion, greaterThan(values.first.queueVersion));
    expect(values.last.patientsAhead, lessThan(values.first.patientsAhead));

    source.dispose();
  });

  test('supports developer-only paused scenario', () async {
    final source = MockLiveQueueDataSource(scenario: 'paused');
    final event = await source
        .watch('entry-1')
        .where((event) => event is MockSnapshotEvent)
        .cast<MockSnapshotEvent>()
        .first;
    expect(event.snapshot.sessionStatus, 'paused');
    source.dispose();
  });
}
