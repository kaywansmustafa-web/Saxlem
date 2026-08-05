import '../../../../core/models/patient_profile.dart';
import '../../domain/entities/patient_profiles_snapshot.dart';
import '../../domain/errors/patient_profiles_failure.dart';
import '../../domain/repositories/patient_profiles_repository.dart';

class UnavailablePatientProfilesRepository
    implements PatientProfilesRepository {
  const UnavailablePatientProfilesRepository();
  Never _unavailable() => throw const PatientProfilesFailure(
    PatientProfilesFailureType.unavailable,
  );
  @override
  Future<PatientProfilesSnapshot> load() async => _unavailable();
  @override
  Future<PatientProfilesSnapshot> add(PatientProfileDraft draft) async =>
      _unavailable();
  @override
  Future<PatientProfilesSnapshot> select(PatientProfileId id) async =>
      _unavailable();
  @override
  Stream<PatientProfilesSnapshot> watch() => const Stream.empty();
  @override
  Future<void> dispose() async {}
}
