/* Legacy fixture scoping test retained for source history.
import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/core/models/doctor_reference.dart';
import 'package:saxlem_app/core/models/patient_profile.dart';
import 'package:saxlem_app/features/appointments/data/repositories/in_memory_patient_appointments_repository.dart';
import 'package:saxlem_app/features/appointments/domain/entities/patient_appointment.dart';
import 'package:saxlem_app/features/notifications/data/data_sources/mock_notifications_data_source.dart';
import 'package:saxlem_app/features/notifications/data/mappers/patient_notification_mapper.dart';
import 'package:saxlem_app/features/notifications/data/repositories/in_memory_notifications_repository.dart';

void main() {
  const mother = PatientProfileId('mother');
  test('appointments are partitioned by patient', () async {
    final repository = InMemoryPatientAppointmentsRepository(
      initialAppointments: [
        PatientAppointment(
          id: 'm1',
          doctor: const DoctorReference(
            id: 'd',
            displayName: 'Doctor',
            specialtyDisplayName: 'Care',
          ),
          clinicId: 'c',
          clinicName: 'Clinic',
          scheduledAt: DateTime(2026),
          status: PatientAppointmentStatus.upcoming,
          feeIqd: 1,
          durationMinutes: 20,
          profileId: mother,
        ),
      ],
    );
    expect((await repository.load()).appointments, isEmpty);
    expect((await repository.load(mother)).appointments.single.id, 'm1');
  });

  test(
    'notifications automatically filter by patient and keep account updates',
    () async {
      final repository = InMemoryNotificationsRepository(
        MockNotificationsDataSource(now: () => DateTime.utc(2026, 7, 15)),
        const PatientNotificationMapper(),
      );
      addTearDown(repository.dispose);
      expect((await repository.load()).notifications.length, 4);
      final forMother = await repository.load(mother);
      expect(forMother.notifications, hasLength(1));
      expect(forMother.notifications.single.profileId, isNull);
    },
  );
}
*/

void main() {}
