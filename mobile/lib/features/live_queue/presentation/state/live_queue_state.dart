import '../../domain/entities/patient_queue_status.dart';
import '../../domain/repositories/live_queue_repository.dart';

sealed class LiveQueueState {
  const LiveQueueState();
}

class LiveQueueInitial extends LiveQueueState {
  const LiveQueueInitial();
}

class LiveQueueLoading extends LiveQueueState {
  const LiveQueueLoading();
}

class LiveQueueReady extends LiveQueueState {
  const LiveQueueReady(this.status, {this.refreshProblem});
  final PatientQueueStatus status;
  final LiveQueueProblem? refreshProblem;
}

class LiveQueueFailed extends LiveQueueState {
  const LiveQueueFailed(this.problem);
  final LiveQueueProblem problem;
}
