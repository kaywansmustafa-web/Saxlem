import '../../domain/entities/patient_queue_snapshot.dart';
import '../../domain/entities/queue_types.dart';

sealed class LiveQueueState {
  const LiveQueueState();
  PatientQueueSnapshot? get snapshot => null;
}

class LiveQueueInitial extends LiveQueueState {
  const LiveQueueInitial();
}

class LiveQueueLoading extends LiveQueueState {
  const LiveQueueLoading();
}

class LiveQueueLive extends LiveQueueState {
  const LiveQueueLive(this.value, {this.feedbackMessage});
  final PatientQueueSnapshot value;
  final String? feedbackMessage;
  @override
  PatientQueueSnapshot get snapshot => value;
}

class LiveQueueActionPending extends LiveQueueState {
  const LiveQueueActionPending(this.value, this.action);
  final PatientQueueSnapshot value;
  final PatientQueueAction action;
  @override
  PatientQueueSnapshot get snapshot => value;
}

class LiveQueueReconnecting extends LiveQueueState {
  const LiveQueueReconnecting(this.value);
  final PatientQueueSnapshot value;
  @override
  PatientQueueSnapshot get snapshot => value;
}

class LiveQueueStale extends LiveQueueState {
  const LiveQueueStale(this.value);
  final PatientQueueSnapshot value;
  @override
  PatientQueueSnapshot get snapshot => value;
}

class LiveQueueOffline extends LiveQueueState {
  const LiveQueueOffline(this.value);
  final PatientQueueSnapshot? value;
  @override
  PatientQueueSnapshot? get snapshot => value;
}

class LiveQueuePaused extends LiveQueueState {
  const LiveQueuePaused(this.value);
  final PatientQueueSnapshot value;
  @override
  PatientQueueSnapshot get snapshot => value;
}

class LiveQueueClosed extends LiveQueueState {
  const LiveQueueClosed(this.value);
  final PatientQueueSnapshot value;
  @override
  PatientQueueSnapshot get snapshot => value;
}

class LiveQueueFailure extends LiveQueueState {
  const LiveQueueFailure(this.message, {this.value});
  final String message;
  final PatientQueueSnapshot? value;
  @override
  PatientQueueSnapshot? get snapshot => value;
}
