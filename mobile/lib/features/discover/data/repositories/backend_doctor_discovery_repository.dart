import '../../../../core/network/api_failure.dart';
import '../../../../core/network/authenticated_api_client.dart';
import '../../domain/entities/doctor_discovery_options.dart';
import '../../domain/entities/doctor_discovery_result.dart';
import '../../domain/entities/doctor_search_criteria.dart';
import '../../domain/entities/doctor_search_page.dart';
import '../../domain/repositories/doctor_discovery_repository.dart';
import '../dto/backend_doctor_discovery_dto.dart';

class BackendDoctorDiscoveryRepository implements DoctorDiscoveryRepository {
  BackendDoctorDiscoveryRepository(
    this._api, {
    this._parser = const BackendDoctorDiscoveryParser(),
  });
  final AuthenticatedApiClient _api;
  final BackendDoctorDiscoveryParser _parser;
  static final _uuid = RegExp(
    r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$',
  );
  @override
  Future<DoctorDiscoveryOptions> loadOptions() => _guard(
    () async =>
        _parser.options((await _api.getJson('doctors/discovery-options')).body),
  );
  @override
  Future<DoctorSearchPage> search(
    DoctorSearchCriteria criteria, {
    required int page,
    int pageSize = 20,
  }) {
    if (page < 1 || page > 10000 || pageSize < 1 || pageSize > 100) {
      throw const DoctorDiscoveryFailure(
        DoctorDiscoveryFailureType.malformedResponse,
      );
    }
    final query = criteria.query.trim();
    if (query.length > 120 ||
        (criteria.clinicId != null && !_uuid.hasMatch(criteria.clinicId!)) ||
        (criteria.minimumYearsOfExperience != null &&
            (criteria.minimumYearsOfExperience! < 0 ||
                criteria.minimumYearsOfExperience! > 80))) {
      throw const DoctorDiscoveryFailure(
        DoctorDiscoveryFailureType.malformedResponse,
      );
    }
    final params = <String, String>{'page': '$page', 'pageSize': '$pageSize'};
    if (query.isNotEmpty) params['name'] = query;
    if (criteria.specialtyCode case final value?) params['specialty'] = value;
    if (criteria.clinicId case final value?) params['clinicId'] = value;
    if (criteria.language case final value?) params['language'] = value;
    if (criteria.gender case final value?) params['gender'] = value.name;
    if (criteria.minimumYearsOfExperience case final value?) {
      params['minimumYearsOfExperience'] = '$value';
    }
    return _guard(
      () async => _parser.page(
        (await _api.getJson('doctors', queryParameters: params)).body,
      ),
    );
  }

  @override
  Future<DoctorDiscoveryResult> loadDoctor(String doctorId) {
    if (!_uuid.hasMatch(doctorId)) {
      throw const DoctorDiscoveryFailure(DoctorDiscoveryFailureType.notFound);
    }
    return _guard(() async {
      final detail = _parser.doctor(
        (await _api.getJson('doctors/$doctorId')).body,
        detail: true,
      );
      final profile = (await _api.getJson('doctors/$doctorId/profile')).body;
      _parser.validateProfile(profile, doctorId);
      _parser.validateSpecialties(
        (await _api.getJsonList('doctors/$doctorId/specialties')).body,
      );
      _parser.validateScheduleAvailability(
        (await _api.getJson('doctors/$doctorId/availability')).body,
        doctorId,
      );
      return detail;
    });
  }

  Future<T> _guard<T>(Future<T> Function() action) async {
    try {
      return await action();
    } on DoctorContractException {
      throw const DoctorDiscoveryFailure(
        DoctorDiscoveryFailureType.malformedResponse,
      );
    } on ApiFailure catch (failure) {
      throw DoctorDiscoveryFailure(switch (failure.type) {
        ApiFailureType.unauthenticated =>
          DoctorDiscoveryFailureType.unauthenticated,
        ApiFailureType.forbidden => DoctorDiscoveryFailureType.forbidden,
        ApiFailureType.notFound => DoctorDiscoveryFailureType.notFound,
        ApiFailureType.timeout => DoctorDiscoveryFailureType.timeout,
        ApiFailureType.offline => DoctorDiscoveryFailureType.offline,
        ApiFailureType.rateLimited => DoctorDiscoveryFailureType.rateLimited,
        ApiFailureType.unavailable ||
        ApiFailureType.server => DoctorDiscoveryFailureType.unavailable,
        ApiFailureType.malformedResponse =>
          DoctorDiscoveryFailureType.malformedResponse,
        _ => DoctorDiscoveryFailureType.unknown,
      });
    }
  }
}
