import 'package:flutter/foundation.dart';
import '../../../booking/domain/services/booking_operation_id.dart';
import '../../domain/repositories/patient_arrival_repository.dart';
import '../state/patient_arrival_state.dart';

class PatientArrivalController extends ChangeNotifier {
  PatientArrivalController({
    required this.appointmentId,
    required this.expectedProfileId,
    required PatientArrivalRepository repository,
    required BookingOperationIdGenerator operationIds,
  }) : _repository = repository,
       _operationIds = operationIds;
  final String appointmentId, expectedProfileId;
  final PatientArrivalRepository _repository;
  final BookingOperationIdGenerator _operationIds;
  PatientArrivalState _state = const PatientArrivalInitial();
  int _generation = 0;
  bool _disposed = false;
  String? _operationId;
  int? _operationVersion;
  PatientArrivalState get state => _state;
  Future<void> load() async {
    final generation = ++_generation;
    _operationId = null;
    _operationVersion = null;
    _set(const PatientArrivalLoading());
    try {
      final value = await _repository.getArrival(appointmentId);
      if (value.appointmentId != appointmentId ||
          value.patientProfileId != expectedProfileId)
        throw const ArrivalFailure(ArrivalProblem.forbidden);
      if (generation == _generation) _set(PatientArrivalReady(value));
    } on ArrivalFailure catch (e) {
      if (generation == _generation) _set(PatientArrivalFailed(e.problem));
    }
  }

  Future<void> recordArrival() async {
    final current = _state;
    if (current is! PatientArrivalReady ||
        current.submitting ||
        !current.arrival.eligibility.canArrive)
      return;
    final version = current.arrival.version;
    if (_operationVersion != version) {
      _operationId = _operationIds.generate();
      _operationVersion = version;
    }
    _set(PatientArrivalReady(current.arrival, submitting: true));
    try {
      final value = await _repository.recordArrival(
        appointmentId,
        version,
        _operationId!,
      );
      if (value.appointmentId != appointmentId ||
          value.patientProfileId != expectedProfileId) {
        throw const ArrivalFailure(ArrivalProblem.forbidden);
      }
      _operationId = null;
      _operationVersion = null;
      _set(PatientArrivalReady(value));
    } on ArrivalFailure catch (e) {
      if (e.problem == ArrivalProblem.conflict) {
        _operationId = null;
        _operationVersion = null;
        await load();
        return;
      }
      _set(PatientArrivalReady(current.arrival, problem: e.problem));
    }
  }

  void invalidate() {
    _generation++;
    _operationId = null;
    _operationVersion = null;
    _set(const PatientArrivalInitial());
  }

  void _set(PatientArrivalState value) {
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
