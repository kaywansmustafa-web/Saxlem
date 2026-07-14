import '../../domain/entities/queue_types.dart';
import '../../domain/repositories/live_queue_repository.dart';
import '../data_sources/mock_live_queue_data_source.dart';
import '../mappers/patient_queue_snapshot_mapper.dart';

class LiveQueueRepositoryImpl implements LiveQueueRepository {
  LiveQueueRepositoryImpl(this._dataSource, this._mapper);

  final MockLiveQueueDataSource _dataSource;
  final PatientQueueSnapshotMapper _mapper;

  @override
  Stream<LiveQueueUpdate> watchQueue(String queueEntryId) => _dataSource
      .watch(queueEntryId)
      .map(
        (event) => switch (event) {
          MockSnapshotEvent(:final snapshot) => QueueSnapshotUpdate(
            _mapper.toDomain(snapshot),
          ),
          MockConnectionEvent(:final status) => QueueConnectionUpdate(
            QueueConnectionStatus.values.byName(status),
          ),
          MockFailureEvent(:final message) => QueueFailureUpdate(message),
        },
      );

  @override
  Future<void> performAction(String queueEntryId, PatientQueueAction action) =>
      _dataSource.performAction(action.name);

  @override
  Future<void> refresh(String queueEntryId) => _dataSource.refresh();

  @override
  void dispose() => _dataSource.dispose();
}
