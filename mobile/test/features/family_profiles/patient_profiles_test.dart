import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/core/models/patient_profile.dart';
import 'package:saxlem_app/features/family_profiles/data/repositories/in_memory_patient_profiles_repository.dart';
import 'package:saxlem_app/features/family_profiles/presentation/controllers/patient_profiles_controller.dart';

void main() {
  test('switches active patient and derives age and initials', () async {
    final repository = InMemoryPatientProfilesRepository();
    final controller = PatientProfilesController(repository, guest: false);
    await controller.load();
    await controller.add(
      relationship: PatientRelationship.mother,
      firstName: 'Narin',
      lastName: 'Ahmed',
      gender: PatientGender.female,
      dateOfBirth: DateTime(1965, 8, 20),
    );
    expect(controller.activeProfile!.relationship, PatientRelationship.mother);
    expect(controller.activeProfile!.initials, 'NA');
    expect(controller.activeProfile!.ageAt(DateTime(2026, 7, 15)), 60);
    await controller.select(PatientProfileId.me);
    expect(controller.activeProfileId, PatientProfileId.me);
    controller.dispose();
  });

  test('guest cannot add a patient', () async {
    final controller = PatientProfilesController(
      InMemoryPatientProfilesRepository(),
      guest: true,
    );
    await controller.load();
    await expectLater(
      controller.add(
        relationship: PatientRelationship.son,
        firstName: 'A',
        lastName: 'B',
        gender: PatientGender.male,
        dateOfBirth: DateTime(2020),
      ),
      throwsStateError,
    );
    controller.dispose();
  });

  test(
    'inactive authoritative profiles are not exposed for selection',
    () async {
      final controller = PatientProfilesController(
        InMemoryPatientProfilesRepository(
          profiles: [
            PatientProfile(
              id: PatientProfileId.me,
              relationship: PatientRelationship.me,
              firstName: 'Ari',
              lastName: 'Ahmed',
              gender: PatientGender.male,
              dateOfBirth: DateTime(2000),
            ),
            PatientProfile(
              id: const PatientProfileId('archived'),
              relationship: PatientRelationship.other,
              firstName: 'Old',
              lastName: 'Profile',
              gender: PatientGender.unspecified,
              dateOfBirth: DateTime(1990),
              active: false,
            ),
          ],
        ),
        guest: false,
      );
      await controller.load();
      expect(controller.profiles.map((profile) => profile.id), [
        PatientProfileId.me,
      ]);
      controller.dispose();
    },
  );
}
