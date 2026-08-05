import '../../../../core/models/patient_profile.dart';

class PatientProfilesSnapshot {
  PatientProfilesSnapshot({
    required Iterable<PatientProfile> profiles,
    required this.activeProfileId,
    this.accountId,
    this.authoritative = false,
  }) : profiles = List.unmodifiable(profiles);
  final List<PatientProfile> profiles;
  final PatientProfileId? activeProfileId;
  final String? accountId;
  final bool authoritative;
  PatientProfile? get activeProfile => activeProfileId == null
      ? null
      : profiles.cast<PatientProfile?>().firstWhere(
          (profile) => profile?.id == activeProfileId,
          orElse: () => null,
        );
}
