import 'discovery_types.dart';

class DoctorSearchCriteria {
  const DoctorSearchCriteria({
    this.query = '',
    this.specialty,
    this.cityId,
    this.areaIds = const {},
    this.gender,
    this.minimumFeeIqd = 0,
    this.maximumFeeIqd = 100000,
    this.availableToday = false,
    this.availableNow = false,
    this.shortestWaitOnly = false,
    this.languages = const {},
    this.verifiedOnly = false,
    this.sort = DiscoverySort.recommended,
  }) : assert(minimumFeeIqd >= 0),
       assert(maximumFeeIqd >= minimumFeeIqd);
  final String query;
  final MedicalSpecialty? specialty;
  final String? cityId;
  final Set<String> areaIds;
  final DoctorGender? gender;
  final int minimumFeeIqd;
  final int maximumFeeIqd;
  final bool availableToday;
  final bool availableNow;
  final bool shortestWaitOnly;
  final Set<SpokenLanguage> languages;
  final bool verifiedOnly;
  final DiscoverySort sort;

  bool get hasFilters =>
      specialty != null ||
      cityId != null ||
      areaIds.isNotEmpty ||
      gender != null ||
      minimumFeeIqd > 0 ||
      maximumFeeIqd < 100000 ||
      availableToday ||
      availableNow ||
      shortestWaitOnly ||
      languages.isNotEmpty ||
      verifiedOnly;
  DoctorSearchCriteria copyWith({
    String? query,
    MedicalSpecialty? specialty,
    bool clearSpecialty = false,
    String? cityId,
    Set<String>? areaIds,
    DoctorGender? gender,
    int? minimumFeeIqd,
    int? maximumFeeIqd,
    bool? availableToday,
    bool? availableNow,
    bool? shortestWaitOnly,
    Set<SpokenLanguage>? languages,
    bool? verifiedOnly,
    DiscoverySort? sort,
  }) => DoctorSearchCriteria(
    query: query ?? this.query,
    specialty: clearSpecialty ? null : specialty ?? this.specialty,
    cityId: cityId ?? this.cityId,
    areaIds: areaIds ?? this.areaIds,
    gender: gender ?? this.gender,
    minimumFeeIqd: minimumFeeIqd ?? this.minimumFeeIqd,
    maximumFeeIqd: maximumFeeIqd ?? this.maximumFeeIqd,
    availableToday: availableToday ?? this.availableToday,
    availableNow: availableNow ?? this.availableNow,
    shortestWaitOnly: shortestWaitOnly ?? this.shortestWaitOnly,
    languages: languages ?? this.languages,
    verifiedOnly: verifiedOnly ?? this.verifiedOnly,
    sort: sort ?? this.sort,
  );
  DoctorSearchCriteria clearFilters() =>
      DoctorSearchCriteria(query: query, sort: sort);
}
