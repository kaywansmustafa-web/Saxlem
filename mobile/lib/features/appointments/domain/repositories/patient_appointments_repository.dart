import '../entities/appointments_snapshot.dart';
import '../entities/patient_appointment.dart';
import '../../../../core/models/patient_profile.dart';

abstract interface class PatientAppointmentsRepository {
  Future<AppointmentsSnapshot> load([
    PatientProfileId profileId = PatientProfileId.me,
  ]);
  Stream<AppointmentsSnapshot> watch([
    PatientProfileId profileId = PatientProfileId.me,
  ]);
  Future<void> add(PatientAppointment appointment);
}
