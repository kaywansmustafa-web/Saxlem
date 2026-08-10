import 'package:flutter/foundation.dart';
import '../../domain/repositories/live_queue_repository.dart';
import '../state/live_queue_state.dart';

class LiveQueueController extends ChangeNotifier {
  LiveQueueController({
    required this.appointmentId,
    required LiveQueueRepository repository,
  }) : _repository = repository;
  final String appointmentId;
  final LiveQueueRepository _repository;
  LiveQueueState _state = const LiveQueueInitial();
  int _generation = 0;
  bool _disposed = false;
  LiveQueueState get state => _state;
  Future<void> load() async {
    final generation = ++_generation;
    final previous = _state is LiveQueueReady
        ? (_state as LiveQueueReady).status
        : null;
    if (previous == null) _set(const LiveQueueLoading());
    try {
      final value = await _repository.getQueueStatus(appointmentId);
      if (generation == _generation) _set(LiveQueueReady(value));
    } on LiveQueueFailure catch (e) {
      if (generation == _generation)
        _set(
          previous == null
              ? LiveQueueFailed(e.problem)
              : LiveQueueReady(previous, refreshProblem: e.problem),
        );
    }
  }

  void invalidate() {
    _generation++;
    _set(const LiveQueueInitial());
  }

  void _set(LiveQueueState value) {
    if (_disposed) return;
    _state = value;
    notifyListeners();
  }

  @override
  void dispose() {
    _disposed = true;
    _generation++;
    super.dispose();
  }
}

// ignore_for_file: curly_braces_in_flow_control_structures, prefer_initializing_formals
