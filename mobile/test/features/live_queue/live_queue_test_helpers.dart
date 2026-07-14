import 'dart:async';

import 'package:saxlem_app/features/live_queue/domain/entities/patient_queue_snapshot.dart';
import 'package:saxlem_app/features/live_queue/domain/entities/queue_types.dart';
import 'package:saxlem_app/features/live_queue/domain/repositories/live_queue_repository.dart';

PatientQueueSnapshot testSnapshot({
  QueueSessionStatus sessionStatus = QueueSessionStatus.open,
  int version = 1,
}) => PatientQueueSnapshot(
  sessionId: 'session-1',
  queueEntryId: 'entry-1',
  queueVersion: version,
  careProviderDisplayName: 'Dr. Test',
  serviceDisplayName: 'Cardiology',
  anonymousCurrentToken: '18',
  patientNumber: '23',
  patientsAhead: 4,
  estimatedWaitLowerMinutes: 20,
  estimatedWaitUpperMinutes: 28,
  estimateConfidence: QueueEstimateConfidence.medium,
  doctorTimingMinutes: 8,
  patientStatus: PatientQueueStatus.expected,
  sessionStatus: sessionStatus,
  lastUpdatedAt: DateTime.now(),
  remoteWaitingAllowed: true,
  allowedActions: const {
    PatientQueueAction.onMyWay,
    PatientQueueAction.arrived,
    PatientQueueAction.requestHelp,
  },
  guidanceMessage: 'Relax, no need to leave yet.',
);

class FakeLiveQueueRepository implements LiveQueueRepository {
  final controller = StreamController<LiveQueueUpdate>();
  final actions = <PatientQueueAction>[];
  bool disposed = false;
  Object? actionError;

  @override
  Stream<LiveQueueUpdate> watchQueue(String queueEntryId) => controller.stream;

  @override
  Future<void> performAction(
    String queueEntryId,
    PatientQueueAction action,
  ) async {
    actions.add(action);
    if (actionError case final error?) throw error;
  }

  @override
  Future<void> refresh(String queueEntryId) async {
    controller.add(
      const QueueConnectionUpdate(QueueConnectionStatus.connected),
    );
  }

  @override
  void dispose() {
    disposed = true;
    controller.close();
  }
}
