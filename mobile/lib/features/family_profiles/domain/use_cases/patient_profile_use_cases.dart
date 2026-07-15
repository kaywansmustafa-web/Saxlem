import '../../../../core/models/patient_profile.dart';
import '../entities/patient_profiles_snapshot.dart';
import '../repositories/patient_profiles_repository.dart';

class LoadPatientProfiles {
  const LoadPatientProfiles(this.repository);
  final PatientProfilesRepository repository;
  Future<PatientProfilesSnapshot> call() => repository.load();
}

class WatchPatientProfiles {
  const WatchPatientProfiles(this.repository);
  final PatientProfilesRepository repository;
  Stream<PatientProfilesSnapshot> call() => repository.watch();
}

class AddPatientProfile {
  const AddPatientProfile(this.repository);
  final PatientProfilesRepository repository;
  Future<void> call(PatientProfile profile) => repository.add(profile);
}

class SelectPatientProfile {
  const SelectPatientProfile(this.repository);
  final PatientProfilesRepository repository;
  Future<void> call(PatientProfileId id) => repository.select(id);
}
