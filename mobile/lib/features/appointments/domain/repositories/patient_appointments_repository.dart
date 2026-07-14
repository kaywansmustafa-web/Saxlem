import '../entities/appointments_snapshot.dart';
import '../entities/patient_appointment.dart';

abstract interface class PatientAppointmentsRepository {
  Future<AppointmentsSnapshot> load();
  Stream<AppointmentsSnapshot> watch();
  Future<void> add(PatientAppointment appointment);
}
