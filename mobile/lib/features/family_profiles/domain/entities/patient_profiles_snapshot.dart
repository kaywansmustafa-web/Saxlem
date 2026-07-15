import '../../../../core/models/patient_profile.dart';

class PatientProfilesSnapshot {
  PatientProfilesSnapshot({
    required Iterable<PatientProfile> profiles,
    required this.activeProfileId,
  }) : profiles = List.unmodifiable(profiles);
  final List<PatientProfile> profiles;
  final PatientProfileId activeProfileId;
  PatientProfile get activeProfile =>
      profiles.firstWhere((p) => p.id == activeProfileId);
}
