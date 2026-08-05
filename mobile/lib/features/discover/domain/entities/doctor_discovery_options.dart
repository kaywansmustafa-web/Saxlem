import 'doctor_discovery_result.dart';

class DoctorSpecialtyOption {
  const DoctorSpecialtyOption({required this.code, required this.displayName});
  final String code;
  final String displayName;
}

class DoctorDiscoveryOptions {
  const DoctorDiscoveryOptions({
    required this.specialties,
    required this.clinics,
    required this.languages,
    required this.genders,
    required this.minimumExperience,
    required this.maximumExperience,
  });
  final List<DoctorSpecialtyOption> specialties;
  final List<DoctorClinicReference> clinics;
  final List<String> languages;
  final List<BackendDoctorGender> genders;
  final int? minimumExperience;
  final int? maximumExperience;
}
