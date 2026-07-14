import '../repositories/live_queue_repository.dart';

class WatchPatientQueue {
  const WatchPatientQueue(this._repository);
  final LiveQueueRepository _repository;

  Stream<LiveQueueUpdate> call(String queueEntryId) =>
      _repository.watchQueue(queueEntryId);
}
