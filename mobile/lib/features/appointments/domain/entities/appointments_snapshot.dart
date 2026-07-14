import 'patient_appointment.dart';

class AppointmentsSnapshot {
  const AppointmentsSnapshot({
    required this.appointments,
    required this.hasAppointmentHistory,
  });

  final List<PatientAppointment> appointments;
  final bool hasAppointmentHistory;
}
