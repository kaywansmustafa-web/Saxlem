import '../../domain/entities/discovery_types.dart';
import '../../domain/entities/doctor_discovery_result.dart';
import '../../domain/entities/doctor_search_criteria.dart';
import '../../domain/entities/doctor_search_page.dart';
import '../../domain/repositories/doctor_discovery_repository.dart';
import '../../domain/services/patient_term_specialty_mapper.dart';
import '../data_sources/mock_doctor_discovery_data_source.dart';
import '../mappers/doctor_discovery_result_mapper.dart';

class DoctorDiscoveryRepositoryImpl implements DoctorDiscoveryRepository {
  DoctorDiscoveryRepositoryImpl(this._source, this._mapper, this._termMapper);
  final MockDoctorDiscoveryDataSource _source;
  final DoctorDiscoveryResultMapper _mapper;
  final PatientTermSpecialtyMapper _termMapper;
  final Set<String> _myDoctors = {};
  final List<String> _recent = [];

  @override
  Future<DoctorSearchPage> search(
    DoctorSearchCriteria criteria, {
    int offset = 0,
    int limit = 12,
  }) async {
    final dtos = await _source.fetch();
    var values = dtos
        .map(
          (dto) => _mapper.toDomain(
            dto,
            isInMyDoctors: _myDoctors.contains(dto.doctorId),
          ),
        )
        .toList();
    final query = _termMapper.normalize(criteria.query);
    final mappedSpecialty = _termMapper.specialtyFor(query);
    if (query.isNotEmpty) {
      values = values.where((doctor) {
        final text = _termMapper.normalize(
          '${doctor.doctorDisplayName} ${doctor.clinicDisplayName} ${doctor.specialty.name} ${doctor.subSpecialtyDisplayName}',
        );
        return text.contains(query) ||
            (mappedSpecialty != null && doctor.specialty == mappedSpecialty);
      }).toList();
    }
    values = values
        .where(
          (d) =>
              (criteria.specialty == null ||
                  d.specialty == criteria.specialty) &&
              (criteria.cityId == null ||
                  d.location.cityId == criteria.cityId) &&
              (criteria.areaIds.isEmpty ||
                  criteria.areaIds.contains(d.location.areaId)) &&
              (criteria.gender == null || d.gender == criteria.gender) &&
              d.consultationFeeIqd >= criteria.minimumFeeIqd &&
              d.consultationFeeIqd <= criteria.maximumFeeIqd &&
              (!criteria.availableToday ||
                  d.availability.status == AvailabilityStatus.availableNow ||
                  d.availability.status == AvailabilityStatus.availableToday) &&
              (!criteria.availableNow ||
                  d.availability.status == AvailabilityStatus.availableNow) &&
              (!criteria.shortestWaitOnly ||
                  d.availability.expectedWaitMinutes != null) &&
              criteria.languages.every(d.languages.contains) &&
              (!criteria.verifiedOnly || d.verified),
        )
        .toList();
    values.sort((a, b) => _compare(a, b, criteria.sort));
    final total = values.length;
    final end = (offset + limit).clamp(0, total);
    final page = offset >= total
        ? <DoctorDiscoveryResult>[]
        : values.sublist(offset, end);
    return DoctorSearchPage(
      results: page,
      totalCount: total,
      hasMore: end < total,
      updatedAt: DateTime.now(),
      stale: _source.scenario == 'stale',
    );
  }

  int _compare(
    DoctorDiscoveryResult a,
    DoctorDiscoveryResult b,
    DiscoverySort sort,
  ) {
    int result = switch (sort) {
      DiscoverySort.recommended => b.recommendationScore.compareTo(
        a.recommendationScore,
      ),
      DiscoverySort.earliestAvailability => _dateValue(
        a,
      ).compareTo(_dateValue(b)),
      DiscoverySort.shortestWait =>
        (a.availability.expectedWaitMinutes ?? 9999).compareTo(
          b.availability.expectedWaitMinutes ?? 9999,
        ),
      DiscoverySort.nearest => a.location.distanceMeters.compareTo(
        b.location.distanceMeters,
      ),
      DiscoverySort.lowestFee => a.consultationFeeIqd.compareTo(
        b.consultationFeeIqd,
      ),
      DiscoverySort.highestRating => b.patientRating.compareTo(a.patientRating),
    };
    return result != 0 ? result : a.doctorId.compareTo(b.doctorId);
  }

  int _dateValue(DoctorDiscoveryResult d) =>
      d.availability.earliestAvailableAt?.millisecondsSinceEpoch ?? 1 << 62;

  @override
  Future<bool> toggleMyDoctor(String doctorId) async {
    await Future<void>.delayed(const Duration(milliseconds: 180));
    return _myDoctors.contains(doctorId)
        ? (_myDoctors.remove(doctorId), false).$2
        : (_myDoctors.add(doctorId), true).$2;
  }

  @override
  List<String> recentSearches() => List.unmodifiable(_recent);
  @override
  void saveRecentSearch(String query) {
    final value = query.trim();
    if (value.isEmpty) return;
    _recent.removeWhere(
      (e) => _termMapper.normalize(e) == _termMapper.normalize(value),
    );
    _recent.insert(0, value);
    if (_recent.length > 5) _recent.removeLast();
  }
}
