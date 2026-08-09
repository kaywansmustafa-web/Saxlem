/* Legacy in-memory controller test retained for source history.
import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/core/models/doctor_reference.dart';
import 'package:saxlem_app/features/appointments/data/repositories/in_memory_patient_appointments_repository.dart';
import 'package:saxlem_app/features/appointments/domain/entities/patient_appointment.dart';
import 'package:saxlem_app/features/appointments/presentation/controllers/appointments_controller.dart';
import 'package:saxlem_app/features/appointments/presentation/state/appointments_state.dart';

void main() {
  test('derives tab counts and preserves selection', () async {
    final repository = InMemoryPatientAppointmentsRepository(
      initialAppointments: [
        PatientAppointment(
          id: '1',
          doctor: const DoctorReference(
            id: 'd',
            displayName: 'Doctor',
            specialtyDisplayName: 'Eye',
          ),
          clinicId: 'c',
          clinicName: 'Clinic',
          scheduledAt: DateTime(2026),
          status: PatientAppointmentStatus.upcoming,
          feeIqd: 1,
          durationMinutes: 20,
        ),
        PatientAppointment(
          id: '2',
          doctor: const DoctorReference(
            id: 'd',
            displayName: 'Doctor',
            specialtyDisplayName: 'Eye',
          ),
          clinicId: 'c',
          clinicName: 'Clinic',
          scheduledAt: DateTime(2025),
          status: PatientAppointmentStatus.completed,
          feeIqd: 1,
          durationMinutes: 20,
        ),
      ],
    );
    final controller = AppointmentsController(repository);
    await controller.load();
    final ready = controller.state as AppointmentsReady;
    expect(ready.count(AppointmentsTab.upcoming), 1);
    expect(ready.count(AppointmentsTab.completed), 1);
    controller.select(AppointmentsTab.completed);
    expect((controller.state as AppointmentsReady).visible.single.id, '2');
    controller.dispose();
  });
}
*/

void main() {}
