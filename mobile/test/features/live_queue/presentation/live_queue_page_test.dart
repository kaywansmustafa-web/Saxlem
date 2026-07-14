import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/config/theme/app_theme.dart';
import 'package:saxlem_app/features/live_queue/domain/entities/queue_types.dart';
import 'package:saxlem_app/features/live_queue/domain/repositories/live_queue_repository.dart';
import 'package:saxlem_app/features/live_queue/domain/use_cases/perform_queue_action.dart';
import 'package:saxlem_app/features/live_queue/domain/use_cases/watch_patient_queue.dart';
import 'package:saxlem_app/features/live_queue/presentation/controllers/live_queue_controller.dart';
import 'package:saxlem_app/features/live_queue/presentation/pages/live_queue_page.dart';

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

  Widget subject({
    TextDirection direction = TextDirection.ltr,
    double scale = 1,
  }) => MaterialApp(
    theme: AppTheme.light,
    home: Directionality(
      textDirection: direction,
      child: MediaQuery(
        data: MediaQueryData(textScaler: TextScaler.linear(scale)),
        child: LiveQueuePage(controller: controller),
      ),
    ),
  );

  testWidgets('renders patient-friendly live queue information', (
    tester,
  ) async {
    await tester.pumpWidget(subject());
    repository.controller.add(QueueSnapshotUpdate(testSnapshot()));
    await tester.pump();

    expect(find.text('Your Number'), findsOneWidget);
    expect(find.textContaining('Reliable'), findsOneWidget);
    expect(find.textContaining('Running 8 minutes late'), findsOneWidget);
    expect(find.textContaining('Updated just now'), findsOneWidget);
    expect(find.text('Relax, no need to leave yet.'), findsOneWidget);
  });

  testWidgets('renders paused, stale, closed, and failure states', (
    tester,
  ) async {
    await tester.pumpWidget(subject());
    repository.controller.add(QueueSnapshotUpdate(testSnapshot()));
    repository.controller.add(
      const QueueConnectionUpdate(QueueConnectionStatus.stale),
    );
    await tester.pump();
    expect(find.text('Update delayed'), findsOneWidget);

    repository.controller.add(
      QueueSnapshotUpdate(
        testSnapshot(sessionStatus: QueueSessionStatus.paused),
      ),
    );
    await tester.pump();
    expect(find.text('The queue is temporarily paused'), findsOneWidget);

    repository.controller.add(
      QueueSnapshotUpdate(
        testSnapshot(sessionStatus: QueueSessionStatus.closed),
      ),
    );
    await tester.pump();
    expect(find.text('This queue has closed'), findsOneWidget);

    repository.controller.add(const QueueFailureUpdate('Unable to load.'));
    await tester.pump();
    expect(find.text('Unable to load.'), findsOneWidget);
  });

  testWidgets('supports RTL and large text without overflow', (tester) async {
    await tester.pumpWidget(subject(direction: TextDirection.rtl, scale: 2));
    repository.controller.add(QueueSnapshotUpdate(testSnapshot()));
    await tester.pump();
    await tester.scrollUntilVisible(find.text("I'm on my way"), 200);

    expect(tester.takeException(), isNull);
    expect(find.text("I'm on my way"), findsOneWidget);
  });
}
