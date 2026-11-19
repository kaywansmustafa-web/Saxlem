import 'doctor_discovery_result.dart';

class DoctorSearchCriteria {
  const DoctorSearchCriteria({
    this.query = '',
    this.specialtyCode,
    this.specialtyCodes = const [],
    this.concernLabel,
    this.clinicId,
    this.language,
    this.gender,
    this.minimumYearsOfExperience,
  });
  final String query;

  /// One specialty chosen in the filters.
  final String? specialtyCode;

  /// Any of these specialties: a Home tile ("What's bothering you?") links
  /// several. Ignored when [specialtyCode] is set.
  final List<String> specialtyCodes;

  /// The tile's words, shown as the filter chip.
  final String? concernLabel;
  final String? clinicId;
  final String? language;
  final BackendDoctorGender? gender;
  final int? minimumYearsOfExperience;

  bool get hasConcern => specialtyCode == null && specialtyCodes.isNotEmpty;

  bool get hasFilters =>
      specialtyCode != null ||
      specialtyCodes.isNotEmpty ||
      clinicId != null ||
      language != null ||
      gender != null ||
      minimumYearsOfExperience != null;

  /// Choosing one specialty (or clearing it) replaces a tile's specialties.
  DoctorSearchCriteria copyWith({
    String? query,
    String? specialtyCode,
    bool clearSpecialty = false,
    List<String>? specialtyCodes,
    String? concernLabel,
    String? clinicId,
    bool clearClinic = false,
    String? language,
    bool clearLanguage = false,
    BackendDoctorGender? gender,
    bool clearGender = false,
    int? minimumYearsOfExperience,
    bool clearExperience = false,
  }) {
    final replacesConcern = clearSpecialty || specialtyCode != null;
    return DoctorSearchCriteria(
      query: query ?? this.query,
      specialtyCode: clearSpecialty
          ? null
          : specialtyCode ?? this.specialtyCode,
      specialtyCodes: replacesConcern
          ? const []
          : specialtyCodes ?? this.specialtyCodes,
      concernLabel: replacesConcern ? null : concernLabel ?? this.concernLabel,
      clinicId: clearClinic ? null : clinicId ?? this.clinicId,
      language: clearLanguage ? null : language ?? this.language,
      gender: clearGender ? null : gender ?? this.gender,
      minimumYearsOfExperience: clearExperience
          ? null
          : minimumYearsOfExperience ?? this.minimumYearsOfExperience,
    );
  }

  DoctorSearchCriteria clearFilters() => DoctorSearchCriteria(query: query);

  static bool _same(List<String> a, List<String> b) {
    if (a.length != b.length) return false;
    for (var i = 0; i < a.length; i++) {
      if (a[i] != b[i]) return false;
    }
    return true;
  }

  @override
  bool operator ==(Object other) =>
      other is DoctorSearchCriteria &&
      query.trim() == other.query.trim() &&
      specialtyCode == other.specialtyCode &&
      _same(specialtyCodes, other.specialtyCodes) &&
      concernLabel == other.concernLabel &&
      clinicId == other.clinicId &&
      language == other.language &&
      gender == other.gender &&
      minimumYearsOfExperience == other.minimumYearsOfExperience;
  @override
  int get hashCode => Object.hash(
    query.trim(),
    specialtyCode,
    Object.hashAll(specialtyCodes),
    concernLabel,
    clinicId,
    language,
    gender,
    minimumYearsOfExperience,
  );
}
