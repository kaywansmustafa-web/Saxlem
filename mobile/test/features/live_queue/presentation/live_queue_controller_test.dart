import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/features/live_queue/domain/entities/queue_types.dart';
import 'package:saxlem_app/features/live_queue/domain/repositories/live_queue_repository.dart';
import 'package:saxlem_app/features/live_queue/domain/use_cases/perform_queue_action.dart';
import 'package:saxlem_app/features/live_queue/domain/use_cases/watch_patient_queue.dart';
import 'package:saxlem_app/features/live_queue/presentation/controllers/live_queue_controller.dart';
import 'package:saxlem_app/features/live_queue/presentation/state/live_queue_state.dart';

import '../live_queue_test_helpers.dart';

void main() {
  late FakeLiveQueueRepository repository;
  late LiveQueueController controller;

  setUp(() {
    repository = FakeLiveQueueRepository();
    controller = LiveQueueController(
      queueEntryId: 'entry-1',
      watchQueue: WatchPatientQueue(repository),
      performAction: PerformQueueAction(repository),
      repository: repository,
    )..load();
  });

  tearDown(() => controller.dispose());

  test('maps snapshots and connection events to explicit states', () async {
    repository.controller.add(QueueSnapshotUpdate(testSnapshot()));
    await Future<void>.delayed(Duration.zero);
    expect(controller.state, isA<LiveQueueLive>());

    repository.controller.add(
      const QueueConnectionUpdate(QueueConnectionStatus.stale),
    );
    await Future<void>.delayed(Duration.zero);
    expect(controller.state, isA<LiveQueueStale>());

    repository.controller.add(
      QueueSnapshotUpdate(
        testSnapshot(sessionStatus: QueueSessionStatus.paused),
      ),
    );
    await Future<void>.delayed(Duration.zero);
    expect(controller.state, isA<LiveQueuePaused>());
  });

  test('submits an allowed action only once at a time', () async {
    repository.controller.add(QueueSnapshotUpdate(testSnapshot()));
    await Future<void>.delayed(Duration.zero);

    await Future.wait([
      controller.perform(PatientQueueAction.onMyWay),
      controller.perform(PatientQueueAction.onMyWay),
    ]);

    expect(repository.actions, [PatientQueueAction.onMyWay]);
  });

  test('preserves the snapshot after action failure', () async {
    repository.controller.add(QueueSnapshotUpdate(testSnapshot()));
    await Future<void>.delayed(Duration.zero);
    repository.actionError = StateError('failed');

    await controller.perform(PatientQueueAction.arrived);

    expect(controller.state, isA<LiveQueueFailure>());
    expect(controller.state.snapshot, isNotNull);
  });
}
