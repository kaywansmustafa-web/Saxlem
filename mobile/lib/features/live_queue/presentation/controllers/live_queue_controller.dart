import 'dart:async';

import 'package:flutter/foundation.dart';

import '../../domain/entities/patient_queue_snapshot.dart';
import '../../domain/entities/queue_types.dart';
import '../../domain/repositories/live_queue_repository.dart';
import '../../domain/use_cases/perform_queue_action.dart';
import '../../domain/use_cases/watch_patient_queue.dart';
import '../state/live_queue_state.dart';
import '../../../../core/models/patient_profile.dart';

class LiveQueueController extends ChangeNotifier {
  factory LiveQueueController({
    required String queueEntryId,
    required WatchPatientQueue watchQueue,
    required PerformQueueAction performAction,
    required LiveQueueRepository repository,
    PatientProfileId profileId = PatientProfileId.me,
  }) => LiveQueueController._(
    queueEntryId,
    watchQueue,
    performAction,
    repository,
    profileId,
  );

  LiveQueueController._(
    this._queueEntryId,
    this._watchQueue,
    this._performAction,
    this._repository,
    this._profileId,
  );

  final String _queueEntryId;
  final WatchPatientQueue _watchQueue;
  final PerformQueueAction _performAction;
  final LiveQueueRepository _repository;
  final PatientProfileId _profileId;
  StreamSubscription<LiveQueueUpdate>? _subscription;
  LiveQueueState _state = const LiveQueueInitial();
  bool _actionInFlight = false;
  bool _disposed = false;

  LiveQueueState get state => _state;

  void load() {
    if (_subscription != null) return;
    _setState(const LiveQueueLoading());
    _subscription = _watchQueue(_queueEntryId).listen(
      _handleUpdate,
      onError: (Object error) => _setState(
        LiveQueueFailure(
          'We could not update your queue.',
          value: state.snapshot,
        ),
      ),
    );
  }

  Future<void> perform(PatientQueueAction action) async {
    final snapshot = state.snapshot;
    if (_actionInFlight ||
        snapshot == null ||
        !snapshot.allowedActions.contains(action)) {
      return;
    }
    _actionInFlight = true;
    _setState(LiveQueueActionPending(snapshot, action));
    try {
      await _performAction(_queueEntryId, action);
      final latest = state.snapshot ?? snapshot;
      if (latest.sessionStatus == QueueSessionStatus.open) {
        _setState(LiveQueueLive(latest, feedbackMessage: _successFor(action)));
      }
    } catch (_) {
      _setState(
        LiveQueueFailure(
          'Your request was not sent. Please try again.',
          value: snapshot,
        ),
      );
    } finally {
      _actionInFlight = false;
    }
  }

  Future<void> retry() async {
    final snapshot = state.snapshot;
    if (snapshot != null) _setState(LiveQueueReconnecting(snapshot));
    try {
      await _repository.refresh(_queueEntryId);
    } catch (_) {
      _setState(
        LiveQueueFailure('We are still unable to reconnect.', value: snapshot),
      );
    }
  }

  void _handleUpdate(LiveQueueUpdate update) {
    switch (update) {
      case QueueSnapshotUpdate(:final snapshot):
        _setState(_stateForSnapshot(snapshot.copyWith(profileId: _profileId)));
      case QueueConnectionUpdate(:final status):
        _handleConnection(status);
      case QueueFailureUpdate(:final message):
        _setState(LiveQueueFailure(message, value: state.snapshot));
    }
  }

  LiveQueueState _stateForSnapshot(PatientQueueSnapshot snapshot) =>
      switch (snapshot.sessionStatus) {
        QueueSessionStatus.paused => LiveQueuePaused(snapshot),
        QueueSessionStatus.closed => LiveQueueClosed(snapshot),
        _ => LiveQueueLive(snapshot),
      };

  void _handleConnection(QueueConnectionStatus status) {
    final snapshot = state.snapshot;
    switch (status) {
      case QueueConnectionStatus.connected:
        if (snapshot != null) _setState(_stateForSnapshot(snapshot));
      case QueueConnectionStatus.reconnecting:
        if (snapshot != null) _setState(LiveQueueReconnecting(snapshot));
      case QueueConnectionStatus.stale:
        if (snapshot != null) _setState(LiveQueueStale(snapshot));
      case QueueConnectionStatus.offline:
        _setState(LiveQueueOffline(snapshot));
    }
  }

  String _successFor(PatientQueueAction action) => switch (action) {
    PatientQueueAction.onMyWay =>
      "We've let the clinic know you're on your way.",
    PatientQueueAction.arrived => 'Your arrival has been confirmed.',
    PatientQueueAction.runningLate =>
      "We've let the clinic know you're running late.",
    PatientQueueAction.cancel => 'Your cancellation request has been sent.',
    PatientQueueAction.requestHelp =>
      'Reception has received your help request.',
  };

  void _setState(LiveQueueState value) {
    if (_disposed) return;
    _state = value;
    notifyListeners();
  }

  @override
  void dispose() {
    _disposed = true;
    _subscription?.cancel();
    _repository.dispose();
    super.dispose();
  }
}
