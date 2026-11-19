import '../../../../core/models/patient_profile.dart';
import '../entities/patient_profiles_snapshot.dart';

abstract interface class PatientProfilesRepository {
  Future<PatientProfilesSnapshot> load();
  Stream<PatientProfilesSnapshot> watch();
  Future<PatientProfilesSnapshot> add(PatientProfileDraft profile);
  Future<PatientProfilesSnapshot> select(PatientProfileId id);

  /// Deletes the signed-in patient's Saxlem account.
  Future<DeleteAccountOutcome> deleteAccount();
  Future<void> dispose();
}

/// What happened when the patient asked to delete their account.
enum DeleteAccountOutcome { deleted, upcomingAppointments, failed }
