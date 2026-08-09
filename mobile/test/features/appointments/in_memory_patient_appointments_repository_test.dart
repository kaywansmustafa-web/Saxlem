/* Legacy fixture test retained for source history.
import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/core/models/doctor_reference.dart';
import 'package:saxlem_app/features/appointments/data/repositories/in_memory_patient_appointments_repository.dart';
import 'package:saxlem_app/features/appointments/domain/entities/patient_appointment.dart';

void main() {
  test('stores appointments and marks the patient as returning', () async {
    final repository = InMemoryPatientAppointmentsRepository();
    expect((await repository.load()).hasAppointmentHistory, isFalse);

    await repository.add(
      PatientAppointment(
        id: 'A-1',
        doctor: const DoctorReference(
          id: 'D-1',
          displayName: 'Dr Test',
          specialtyDisplayName: 'Eye',
        ),
        clinicId: 'C-1',
        clinicName: 'Clinic',
        scheduledAt: DateTime(2026, 7, 20, 10),
        status: PatientAppointmentStatus.upcoming,
        feeIqd: 25000,
        durationMinutes: 20,
      ),
    );

    final snapshot = await repository.load();
    expect(snapshot.hasAppointmentHistory, isTrue);
    expect(snapshot.appointments.single.id, 'A-1');
  });
}
*/

void main() {}
