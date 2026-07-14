import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../domain/repositories/patient_appointments_repository.dart';
import '../../domain/entities/appointments_snapshot.dart';
import '../state/appointments_state.dart';

class AppointmentsController extends ChangeNotifier {
  AppointmentsController(this._repository);
  final PatientAppointmentsRepository _repository;
  AppointmentsState state = const AppointmentsLoading();
  StreamSubscription? _subscription;

  Future<void> load() async {
    try {
      _setReady(await _repository.load());
      _subscription ??= _repository.watch().listen(_setReady);
    } catch (_) {
      state = const AppointmentsFailure('We could not load your appointments.');
      notifyListeners();
    }
  }

  void select(AppointmentsTab tab) {
    final current = state;
    if (current is! AppointmentsReady) return;
    state = AppointmentsReady(current.snapshot, tab);
    notifyListeners();
  }

  void _setReady(AppointmentsSnapshot snapshot) {
    final tab = state is AppointmentsReady
        ? (state as AppointmentsReady).selectedTab
        : AppointmentsTab.upcoming;
    state = AppointmentsReady(snapshot, tab);
    notifyListeners();
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}
