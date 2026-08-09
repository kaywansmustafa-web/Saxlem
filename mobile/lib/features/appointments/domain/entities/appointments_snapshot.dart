import 'patient_appointment.dart';

class AppointmentsSnapshot {
  const AppointmentsSnapshot({
    required this.appointments,
    required this.nextCursors,
    required this.hasAppointmentHistory,
  });

  final List<PatientAppointment> appointments;
  final Map<PatientAppointmentStatus, String?> nextCursors;
  final bool hasAppointmentHistory;
}

class AppointmentPage {
  const AppointmentPage({required this.items, required this.nextCursor});
  final List<PatientAppointment> items;
  final String? nextCursor;
}
