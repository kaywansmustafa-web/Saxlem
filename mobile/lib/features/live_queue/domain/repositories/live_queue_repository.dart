import '../entities/patient_queue_snapshot.dart';
import '../entities/queue_types.dart';

sealed class LiveQueueUpdate {
  const LiveQueueUpdate();
}

class QueueSnapshotUpdate extends LiveQueueUpdate {
  const QueueSnapshotUpdate(this.snapshot);
  final PatientQueueSnapshot snapshot;
}

class QueueConnectionUpdate extends LiveQueueUpdate {
  const QueueConnectionUpdate(this.status);
  final QueueConnectionStatus status;
}

class QueueFailureUpdate extends LiveQueueUpdate {
  const QueueFailureUpdate(this.message);
  final String message;
}

abstract interface class LiveQueueRepository {
  Stream<LiveQueueUpdate> watchQueue(String queueEntryId);
  Future<void> performAction(String queueEntryId, PatientQueueAction action);
  Future<void> refresh(String queueEntryId);
  void dispose();
}
