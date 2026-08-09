import 'package:flutter/foundation.dart';
import '../../domain/repositories/patient_appointments_repository.dart';
import '../../domain/entities/appointments_snapshot.dart';
import '../../domain/entities/patient_appointment.dart';
import '../state/appointments_state.dart';
import '../../../../core/models/patient_profile.dart';

class AppointmentsController extends ChangeNotifier {
  AppointmentsController(this._repository);
  final PatientAppointmentsRepository _repository;
  AppointmentsState state = const AppointmentsLoading();
  PatientProfileId _profileId = PatientProfileId.me;
  int _generation = 0;
  bool _disposed = false;
  bool _loadingMore = false;
  DateTime _queryNow = DateTime.now().toUtc();

  Future<void> load([PatientProfileId? profileId]) async {
    final selectedProfileId = profileId ?? _profileId;
    _profileId = selectedProfileId;
    final generation = ++_generation;
    state = const AppointmentsLoading();
    notifyListeners();
    try {
      final now = _queryNow = DateTime.now().toUtc();
      final pages = await Future.wait(
        PatientAppointmentStatus.values.map(
          (status) => _repository.list(
            AppointmentListRequest(
              profileId: selectedProfileId,
              from: _from(status, now),
              to: _to(status, now),
              status: status,
            ),
          ),
        ),
      );
      if (_disposed || generation != _generation) return;
      final appointments =
          pages.expand((page) => page.items).toList(growable: false)
            ..sort((a, b) => a.startsAt.compareTo(b.startsAt));
      state = AppointmentsReady(
        AppointmentsSnapshot(
          appointments: List.unmodifiable(appointments),
          nextCursors: {
            for (var index = 0; index < pages.length; index++)
              PatientAppointmentStatus.values[index]: pages[index].nextCursor,
          },
          hasAppointmentHistory: appointments.isNotEmpty,
        ),
        AppointmentsTab.upcoming,
      );
    } on AppointmentFailure catch (failure) {
      if (_disposed || generation != _generation) return;
      state = AppointmentsFailure(failure.problem);
    }
    if (!_disposed) notifyListeners();
  }

  void select(AppointmentsTab tab) {
    final current = state;
    if (current is! AppointmentsReady) return;
    state = AppointmentsReady(current.snapshot, tab);
    notifyListeners();
  }

  Future<void> loadMore() async {
    final current = state;
    if (current is! AppointmentsReady || _loadingMore || !current.canLoadMore) {
      return;
    }
    _loadingMore = true;
    final generation = _generation;
    state = AppointmentsReady(
      current.snapshot,
      current.selectedTab,
      loadingMore: true,
    );
    notifyListeners();
    try {
      final now = _queryNow;
      final statuses = AppointmentsReady.statusesFor(current.selectedTab)
          .where((status) => current.snapshot.nextCursors[status] != null)
          .toList();
      final pages = await Future.wait(
        statuses.map(
          (status) => _repository.list(
            AppointmentListRequest(
              profileId: _profileId,
              from: _from(status, now),
              to: _to(status, now),
              status: status,
              cursor: current.snapshot.nextCursors[status],
            ),
          ),
        ),
      );
      if (_disposed || generation != _generation) return;
      final byId = {
        for (final item in current.snapshot.appointments) item.id: item,
      };
      for (final page in pages) {
        for (final item in page.items) {
          byId[item.id] = item;
        }
      }
      final items = byId.values.toList()
        ..sort((a, b) => a.startsAt.compareTo(b.startsAt));
      final cursors = Map<PatientAppointmentStatus, String?>.from(
        current.snapshot.nextCursors,
      );
      for (var index = 0; index < statuses.length; index++) {
        cursors[statuses[index]] = pages[index].nextCursor;
      }
      state = AppointmentsReady(
        AppointmentsSnapshot(
          appointments: List.unmodifiable(items),
          nextCursors: Map.unmodifiable(cursors),
          hasAppointmentHistory: true,
        ),
        current.selectedTab,
      );
    } on AppointmentFailure catch (failure) {
      if (_disposed || generation != _generation) return;
      state = AppointmentsReady(
        current.snapshot,
        current.selectedTab,
        loadMoreProblem: failure.problem,
      );
    } finally {
      _loadingMore = false;
      if (!_disposed && generation == _generation) notifyListeners();
    }
  }

  static bool _upcoming(PatientAppointmentStatus status) =>
      status == PatientAppointmentStatus.scheduled ||
      status == PatientAppointmentStatus.confirmed;
  static DateTime _from(PatientAppointmentStatus status, DateTime now) =>
      _upcoming(status) ? now : now.subtract(const Duration(days: 365));
  static DateTime _to(PatientAppointmentStatus status, DateTime now) =>
      _upcoming(status)
      ? now.add(const Duration(days: 366))
      : now.add(const Duration(days: 1));

  @override
  void dispose() {
    _disposed = true;
    _generation++;
    super.dispose();
  }
}
