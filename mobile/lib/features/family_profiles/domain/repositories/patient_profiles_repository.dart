import '../../../../core/models/patient_profile.dart';
import '../entities/patient_profiles_snapshot.dart';

abstract interface class PatientProfilesRepository {
  Future<PatientProfilesSnapshot> load();
  Stream<PatientProfilesSnapshot> watch();
  Future<void> add(PatientProfile profile);
  Future<void> select(PatientProfileId id);
  Future<void> dispose();
}
