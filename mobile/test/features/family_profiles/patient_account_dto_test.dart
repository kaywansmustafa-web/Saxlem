import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/core/network/api_failure.dart';
import 'package:saxlem_app/features/family_profiles/data/dtos/patient_account_dto.dart';

void main() {
  const profileId = '00000000-0000-4000-8000-000000000002';
  Map<String, dynamic> profile() => {
    'id': profileId,
    'firstName': 'Ari',
    'lastName': 'Ahmed',
    'dateOfBirth': '2000-02-29',
    'gender': 'male',
    'relationship': 'me',
    'active': true,
    'version': 1,
    'createdAt': '2026-08-05T10:00:00.000Z',
    'updatedAt': '2026-08-05T10:00:00.000Z',
  };
  Map<String, dynamic> account() => {
    'id': '00000000-0000-4000-8000-000000000001',
    'activeProfileId': profileId,
    'activeProfile': profile(),
    'profileCount': 1,
    'createdAt': '2026-08-05T10:00:00.000Z',
    'updatedAt': '2026-08-05T10:00:00.000Z',
  };

  test('strictly maps a valid authoritative account', () {
    final dto = PatientAccountDto.fromJson(account());
    expect(dto.activeProfile?.toDomain().authoritative, isTrue);
    expect(dto.profileCount, 1);
  });

  test('accepts an internally consistent zero-profile account', () {
    final json = account()
      ..['activeProfileId'] = null
      ..['activeProfile'] = null
      ..['profileCount'] = 0;
    expect(PatientAccountDto.fromJson(json).activeProfile, isNull);
  });

  test('rejects malformed UUID, enum, date and version', () {
    for (final mutation in <void Function(Map<String, dynamic>)>[
      (json) => json['id'] = 'not-a-uuid',
      (json) =>
          (json['activeProfile'] as Map<String, dynamic>)['gender'] = 'unknown',
      (json) => (json['activeProfile'] as Map<String, dynamic>)['dateOfBirth'] =
          '2025-02-29',
      (json) => (json['activeProfile'] as Map<String, dynamic>)['version'] = 0,
    ]) {
      final json = account();
      mutation(json);
      expect(
        () => PatientAccountDto.fromJson(json),
        throwsA(isA<ApiFailure>()),
      );
    }
  });

  test('rejects nullable active-profile mismatch', () {
    final json = account()..['activeProfileId'] = null;
    expect(() => PatientAccountDto.fromJson(json), throwsA(isA<ApiFailure>()));
  });
}
