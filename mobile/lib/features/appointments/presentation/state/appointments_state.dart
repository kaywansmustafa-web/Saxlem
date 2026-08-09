import '../../domain/entities/appointments_snapshot.dart';
import '../../domain/entities/patient_appointment.dart';
import '../../domain/repositories/patient_appointments_repository.dart';

enum AppointmentsTab { upcoming, completed, cancelled }

sealed class AppointmentsState {
  const AppointmentsState();
}

class AppointmentsLoading extends AppointmentsState {
  const AppointmentsLoading();
}

class AppointmentsFailure extends AppointmentsState {
  const AppointmentsFailure(this.problem);
  final AppointmentProblem problem;
}

class AppointmentsReady extends AppointmentsState {
  const AppointmentsReady(
    this.snapshot,
    this.selectedTab, {
    this.loadingMore = false,
    this.loadMoreProblem,
  });
  final AppointmentsSnapshot snapshot;
  final AppointmentsTab selectedTab;
  final bool loadingMore;
  final AppointmentProblem? loadMoreProblem;

  List<PatientAppointment> get visible => snapshot.appointments
      .where((item) => _belongs(item.status, selectedTab))
      .toList(growable: false);

  int count(AppointmentsTab tab) =>
      snapshot.appointments.where((item) => _belongs(item.status, tab)).length;

  bool get canLoadMore => statusesFor(
    selectedTab,
  ).any((status) => snapshot.nextCursors[status] != null);

  static bool _belongs(PatientAppointmentStatus status, AppointmentsTab tab) =>
      statusesFor(tab).contains(status);

  static List<PatientAppointmentStatus> statusesFor(AppointmentsTab tab) =>
      switch (tab) {
        AppointmentsTab.upcoming => const [
          PatientAppointmentStatus.scheduled,
          PatientAppointmentStatus.confirmed,
        ],
        AppointmentsTab.completed => const [
          PatientAppointmentStatus.completed,
          PatientAppointmentStatus.noShow,
        ],
        AppointmentsTab.cancelled => const [PatientAppointmentStatus.cancelled],
      };
}
