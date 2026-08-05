import 'dart:async';

import '../../../../core/models/patient_profile.dart';
import '../../../../core/network/api_failure.dart';
import '../../../../core/network/authenticated_api_client.dart';
import '../../../authentication/domain/errors/auth_failure.dart';
import '../../domain/entities/patient_profiles_snapshot.dart';
import '../../domain/errors/patient_profiles_failure.dart';
import '../../domain/repositories/patient_profiles_repository.dart';
import '../dtos/patient_account_dto.dart';

class BackendPatientProfilesRepository implements PatientProfilesRepository {
  BackendPatientProfilesRepository(this._api);

  final AuthenticatedApiClient _api;
  final _changes = StreamController<PatientProfilesSnapshot>.broadcast();
  PatientProfilesSnapshot? _snapshot;

  @override
  Future<PatientProfilesSnapshot> load() async {
    try {
      final accountResponse = await _api.getJson('patients/me');
      final profilesResponse = await _api.getJsonList('patients/profiles');
      final account = PatientAccountDto.fromJson(accountResponse.body);
      final profiles = _profileList(profilesResponse.body);
      final snapshot = _reconcile(account, profiles);
      _snapshot = snapshot;
      _changes.add(snapshot);
      return snapshot;
    } on ApiFailure catch (failure) {
      final mapped = _mapFailure(failure);
      if (mapped.isTerminalAuthentication) _snapshot = null;
      throw mapped;
    } on AuthFailure {
      _snapshot = null;
      throw const PatientProfilesFailure(
        PatientProfilesFailureType.sessionExpired,
      );
    }
  }

  @override
  Future<PatientProfilesSnapshot> add(PatientProfileDraft draft) async {
    try {
      final response = await _api.postJson(
        'patients/profiles',
        body: {
          'firstName': draft.firstName.trim(),
          'lastName': draft.lastName.trim(),
          'dateOfBirth': _date(draft.dateOfBirth),
          'gender': draft.gender.name,
          'relationship': draft.relationship.name,
        },
      );
      PatientProfileDto.fromJson(response.body);
      return load();
    } on ApiFailure catch (failure) {
      final mapped = _mapFailure(failure);
      if (mapped.isTerminalAuthentication) _snapshot = null;
      throw mapped;
    } on AuthFailure {
      _snapshot = null;
      throw const PatientProfilesFailure(
        PatientProfilesFailureType.sessionExpired,
      );
    }
  }

  @override
  Future<PatientProfilesSnapshot> select(PatientProfileId id) async {
    final current = _snapshot;
    if (current == null ||
        !current.profiles.any(
          (profile) => profile.id == id && profile.active,
        )) {
      throw const PatientProfilesFailure(PatientProfilesFailureType.malformed);
    }
    try {
      final response = await _api.postJson(
        'patients/active',
        body: {'profileId': id.value},
      );
      final account = PatientAccountDto.fromJson(response.body);
      final snapshot = _reconcile(account, current.profiles);
      _snapshot = snapshot;
      _changes.add(snapshot);
      return snapshot;
    } on ApiFailure catch (failure) {
      if (_mapFailure(failure).isTerminalAuthentication) _snapshot = null;
      throw _mapFailure(failure);
    } on AuthFailure {
      _snapshot = null;
      throw const PatientProfilesFailure(
        PatientProfilesFailureType.sessionExpired,
      );
    }
  }

  @override
  Stream<PatientProfilesSnapshot> watch() => _changes.stream;

  @override
  Future<void> dispose() => _changes.close();

  List<PatientProfile> _profileList(List<Object?> values) {
    return values
        .map((item) {
          if (item is! Map<String, dynamic>) {
            throw const ApiFailure(type: ApiFailureType.malformedResponse);
          }
          return PatientProfileDto.fromJson(item).toDomain();
        })
        .toList(growable: false);
  }

  PatientProfilesSnapshot _reconcile(
    PatientAccountDto account,
    List<PatientProfile> profiles,
  ) {
    if (account.profileCount != profiles.length) {
      throw const ApiFailure(type: ApiFailureType.malformedResponse);
    }
    if (profiles.isEmpty) {
      if (account.activeProfileId != null || account.activeProfile != null) {
        throw const ApiFailure(type: ApiFailureType.malformedResponse);
      }
      return PatientProfilesSnapshot(
        profiles: const [],
        activeProfileId: null,
        accountId: account.id,
        authoritative: true,
      );
    }
    final activeId = account.activeProfileId;
    final activeDto = account.activeProfile;
    if (activeId == null || activeDto == null) {
      throw const ApiFailure(type: ApiFailureType.malformedResponse);
    }
    final matches = profiles.where((profile) => profile.id.value == activeId);
    if (matches.length != 1 ||
        !matches.single.active ||
        !_sameProfile(matches.single, activeDto.toDomain())) {
      throw const ApiFailure(type: ApiFailureType.malformedResponse);
    }
    return PatientProfilesSnapshot(
      profiles: profiles,
      activeProfileId: PatientProfileId(activeId),
      accountId: account.id,
      authoritative: true,
    );
  }

  static bool _sameProfile(PatientProfile left, PatientProfile right) =>
      left.id == right.id &&
      left.firstName == right.firstName &&
      left.lastName == right.lastName &&
      left.dateOfBirth == right.dateOfBirth &&
      left.gender == right.gender &&
      left.relationship == right.relationship &&
      left.active == right.active &&
      left.version == right.version &&
      left.createdAt == right.createdAt &&
      left.updatedAt == right.updatedAt;

  static String _date(DateTime value) =>
      '${value.year.toString().padLeft(4, '0')}-'
      '${value.month.toString().padLeft(2, '0')}-'
      '${value.day.toString().padLeft(2, '0')}';

  static PatientProfilesFailure _mapFailure(
    ApiFailure failure,
  ) => PatientProfilesFailure(switch (failure.type) {
    ApiFailureType.unauthenticated => PatientProfilesFailureType.sessionExpired,
    ApiFailureType.forbidden => PatientProfilesFailureType.forbidden,
    ApiFailureType.conflict => PatientProfilesFailureType.conflict,
    ApiFailureType.rateLimited => PatientProfilesFailureType.rateLimited,
    ApiFailureType.timeout => PatientProfilesFailureType.timeout,
    ApiFailureType.offline => PatientProfilesFailureType.offline,
    ApiFailureType.unavailable ||
    ApiFailureType.server => PatientProfilesFailureType.unavailable,
    ApiFailureType.validation => PatientProfilesFailureType.validation,
    ApiFailureType.malformedResponse => PatientProfilesFailureType.malformed,
    _ => PatientProfilesFailureType.unknown,
  });
}
