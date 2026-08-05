import '../../../../core/network/api_failure.dart';
import '../../../../core/models/patient_profile.dart';

class PatientProfileDto {
  const PatientProfileDto({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.dateOfBirth,
    required this.gender,
    required this.relationship,
    required this.active,
    required this.version,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String firstName;
  final String lastName;
  final DateTime dateOfBirth;
  final PatientGender gender;
  final PatientRelationship relationship;
  final bool active;
  final int version;
  final DateTime createdAt;
  final DateTime updatedAt;

  factory PatientProfileDto.fromJson(Map<String, dynamic> json) {
    _requireKeys(json, const {
      'id',
      'firstName',
      'lastName',
      'dateOfBirth',
      'gender',
      'relationship',
      'active',
      'version',
      'createdAt',
      'updatedAt',
    });
    final gender = _enumValue(
      _string(json, 'gender', 32),
      PatientGender.values,
    );
    final relationship = _enumValue(
      _string(json, 'relationship', 32),
      PatientRelationship.values,
    );
    final version = json['version'];
    final active = json['active'];
    if (version is! int ||
        version < 1 ||
        version > 2147483647 ||
        active is! bool) {
      throw const ApiFailure(type: ApiFailureType.malformedResponse);
    }
    return PatientProfileDto(
      id: _uuid(json, 'id'),
      firstName: _string(json, 'firstName', 80),
      lastName: _string(json, 'lastName', 80),
      dateOfBirth: _date(json, 'dateOfBirth'),
      gender: gender,
      relationship: relationship,
      active: active,
      version: version,
      createdAt: _dateTime(json, 'createdAt'),
      updatedAt: _dateTime(json, 'updatedAt'),
    );
  }

  PatientProfile toDomain() => PatientProfile(
    id: PatientProfileId(id),
    relationship: relationship,
    firstName: firstName,
    lastName: lastName,
    gender: gender,
    dateOfBirth: dateOfBirth,
    active: active,
    version: version,
    createdAt: createdAt,
    updatedAt: updatedAt,
    authoritative: true,
  );
}

class PatientAccountDto {
  const PatientAccountDto({
    required this.id,
    required this.activeProfileId,
    required this.activeProfile,
    required this.profileCount,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String? activeProfileId;
  final PatientProfileDto? activeProfile;
  final int profileCount;
  final DateTime createdAt;
  final DateTime updatedAt;

  factory PatientAccountDto.fromJson(Map<String, dynamic> json) {
    _requireKeys(json, const {
      'id',
      'activeProfileId',
      'activeProfile',
      'profileCount',
      'createdAt',
      'updatedAt',
    });
    final count = json['profileCount'];
    if (count is! int || count < 0 || count > 2147483647) {
      throw const ApiFailure(type: ApiFailureType.malformedResponse);
    }
    final activeIdValue = json['activeProfileId'];
    final activeValue = json['activeProfile'];
    if ((activeIdValue == null) != (activeValue == null)) {
      throw const ApiFailure(type: ApiFailureType.malformedResponse);
    }
    final activeId = activeIdValue == null
        ? null
        : _uuidValue(activeIdValue, 'activeProfileId');
    final active = activeValue == null
        ? null
        : activeValue is Map<String, dynamic>
        ? PatientProfileDto.fromJson(activeValue)
        : throw const ApiFailure(type: ApiFailureType.malformedResponse);
    if (active != null && active.id != activeId) {
      throw const ApiFailure(type: ApiFailureType.malformedResponse);
    }
    return PatientAccountDto(
      id: _uuid(json, 'id'),
      activeProfileId: activeId,
      activeProfile: active,
      profileCount: count,
      createdAt: _dateTime(json, 'createdAt'),
      updatedAt: _dateTime(json, 'updatedAt'),
    );
  }
}

final _uuidPattern = RegExp(
  r'^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
);

void _requireKeys(Map<String, dynamic> json, Set<String> expected) {
  if (json.length != expected.length ||
      json.keys.any((key) => !expected.contains(key))) {
    throw const ApiFailure(type: ApiFailureType.malformedResponse);
  }
}

String _string(Map<String, dynamic> json, String key, int maximum) {
  final value = json[key];
  if (value is! String || value.trim().isEmpty || value.length > maximum) {
    throw const ApiFailure(type: ApiFailureType.malformedResponse);
  }
  return value;
}

String _uuid(Map<String, dynamic> json, String key) =>
    _uuidValue(json[key], key);

String _uuidValue(Object? value, String key) {
  if (value is! String || !_uuidPattern.hasMatch(value)) {
    throw const ApiFailure(type: ApiFailureType.malformedResponse);
  }
  return value;
}

DateTime _date(Map<String, dynamic> json, String key) {
  final value = json[key];
  if (value is! String || !RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(value)) {
    throw const ApiFailure(type: ApiFailureType.malformedResponse);
  }
  final parts = value.split('-').map(int.parse).toList(growable: false);
  final parsed = DateTime.utc(parts[0], parts[1], parts[2]);
  if (parsed.year != parts[0] ||
      parsed.month != parts[1] ||
      parsed.day != parts[2]) {
    throw const ApiFailure(type: ApiFailureType.malformedResponse);
  }
  return parsed;
}

DateTime _dateTime(Map<String, dynamic> json, String key) {
  final value = json[key];
  final parsed = value is String ? DateTime.tryParse(value) : null;
  if (parsed == null || !parsed.isUtc) {
    throw const ApiFailure(type: ApiFailureType.malformedResponse);
  }
  return parsed;
}

T _enumValue<T extends Enum>(String name, List<T> values) {
  for (final value in values) {
    if (value.name == name) return value;
  }
  throw const ApiFailure(type: ApiFailureType.malformedResponse);
}
