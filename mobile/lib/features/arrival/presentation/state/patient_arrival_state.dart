import '../../domain/entities/patient_arrival.dart';
import '../../domain/repositories/patient_arrival_repository.dart';

sealed class PatientArrivalState {
  const PatientArrivalState();
}

class PatientArrivalInitial extends PatientArrivalState {
  const PatientArrivalInitial();
}

class PatientArrivalLoading extends PatientArrivalState {
  const PatientArrivalLoading();
}

class PatientArrivalReady extends PatientArrivalState {
  const PatientArrivalReady(
    this.arrival, {
    this.submitting = false,
    this.problem,
  });
  final PatientArrival arrival;
  final bool submitting;
  final ArrivalProblem? problem;
}

class PatientArrivalFailed extends PatientArrivalState {
  const PatientArrivalFailed(this.problem);
  final ArrivalProblem problem;
}
