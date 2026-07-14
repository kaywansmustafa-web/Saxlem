import '../../domain/entities/appointments_snapshot.dart';
import '../../domain/entities/patient_appointment.dart';

enum AppointmentsTab { upcoming, completed, cancelled }

sealed class AppointmentsState {
  const AppointmentsState();
}

class AppointmentsLoading extends AppointmentsState {
  const AppointmentsLoading();
}

class AppointmentsFailure extends AppointmentsState {
  const AppointmentsFailure(this.message);
  final String message;
}

class AppointmentsReady extends AppointmentsState {
  const AppointmentsReady(this.snapshot, this.selectedTab);
  final AppointmentsSnapshot snapshot;
  final AppointmentsTab selectedTab;

  List<PatientAppointment> get visible => snapshot.appointments
      .where((item) => item.status.name == selectedTab.name)
      .toList(growable: false);

  int count(AppointmentsTab tab) => snapshot.appointments
      .where((item) => item.status.name == tab.name)
      .length;
}
