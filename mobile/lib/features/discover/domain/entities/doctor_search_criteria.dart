import 'doctor_discovery_result.dart';

class DoctorSearchCriteria {
  const DoctorSearchCriteria({
    this.query = '',
    this.specialtyCode,
    this.clinicId,
    this.language,
    this.gender,
    this.minimumYearsOfExperience,
  });
  final String query;
  final String? specialtyCode;
  final String? clinicId;
  final String? language;
  final BackendDoctorGender? gender;
  final int? minimumYearsOfExperience;
  bool get hasFilters =>
      specialtyCode != null ||
      clinicId != null ||
      language != null ||
      gender != null ||
      minimumYearsOfExperience != null;
  DoctorSearchCriteria copyWith({
    String? query,
    String? specialtyCode,
    bool clearSpecialty = false,
    String? clinicId,
    bool clearClinic = false,
    String? language,
    bool clearLanguage = false,
    BackendDoctorGender? gender,
    bool clearGender = false,
    int? minimumYearsOfExperience,
    bool clearExperience = false,
  }) => DoctorSearchCriteria(
    query: query ?? this.query,
    specialtyCode: clearSpecialty ? null : specialtyCode ?? this.specialtyCode,
    clinicId: clearClinic ? null : clinicId ?? this.clinicId,
    language: clearLanguage ? null : language ?? this.language,
    gender: clearGender ? null : gender ?? this.gender,
    minimumYearsOfExperience: clearExperience
        ? null
        : minimumYearsOfExperience ?? this.minimumYearsOfExperience,
  );
  DoctorSearchCriteria clearFilters() => DoctorSearchCriteria(query: query);
  @override
  bool operator ==(Object other) =>
      other is DoctorSearchCriteria &&
      query.trim() == other.query.trim() &&
      specialtyCode == other.specialtyCode &&
      clinicId == other.clinicId &&
      language == other.language &&
      gender == other.gender &&
      minimumYearsOfExperience == other.minimumYearsOfExperience;
  @override
  int get hashCode => Object.hash(
    query.trim(),
    specialtyCode,
    clinicId,
    language,
    gender,
    minimumYearsOfExperience,
  );
}
