import '../entities/queue_types.dart';
import '../repositories/live_queue_repository.dart';

class PerformQueueAction {
  const PerformQueueAction(this._repository);
  final LiveQueueRepository _repository;

  Future<void> call(String entryId, PatientQueueAction action) =>
      _repository.performAction(entryId, action);
}
