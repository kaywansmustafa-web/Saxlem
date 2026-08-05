import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:saxlem_app/config/environment/app_configuration.dart';
import 'package:saxlem_app/core/models/patient_profile.dart';
import 'package:saxlem_app/core/network/api_client.dart';
import 'package:saxlem_app/core/network/authenticated_api_client.dart';
import 'package:saxlem_app/features/authentication/domain/repositories/auth_repository.dart';
import 'package:saxlem_app/features/family_profiles/data/repositories/backend_patient_profiles_repository.dart';

void main() {
  const accountId = '00000000-0000-4000-8000-000000000001';
  const profileId = '00000000-0000-4000-8000-000000000002';
  Map<String, Object?> profile() => {
    'id': profileId,
    'firstName': 'Ari',
    'lastName': 'Ahmed',
    'dateOfBirth': '2000-01-01',
    'gender': 'male',
    'relationship': 'me',
    'active': true,
    'version': 1,
    'createdAt': '2026-08-05T10:00:00.000Z',
    'updatedAt': '2026-08-05T10:00:00.000Z',
  };
  Map<String, Object?> account({bool empty = false}) => {
    'id': accountId,
    'activeProfileId': empty ? null : profileId,
    'activeProfile': empty ? null : profile(),
    'profileCount': empty ? 0 : 1,
    'createdAt': '2026-08-05T10:00:00.000Z',
    'updatedAt': '2026-08-05T10:00:00.000Z',
  };

  test('loads and reconciles account with top-level profile array', () async {
    final repository = _repository(
      (request) async => http.Response(
        jsonEncode(request.url.path.endsWith('/me') ? account() : [profile()]),
        200,
        headers: {'content-type': 'application/json'},
      ),
    );
    final snapshot = await repository.load();
    expect(snapshot.accountId, accountId);
    expect(snapshot.activeProfileId?.value, profileId);
    expect(snapshot.activeProfile?.authoritative, isTrue);
  });

  test('represents zero profiles without a synthetic patient', () async {
    final repository = _repository(
      (request) async => http.Response(
        jsonEncode(
          request.url.path.endsWith('/me') ? account(empty: true) : [],
        ),
        200,
      ),
    );
    final snapshot = await repository.load();
    expect(snapshot.profiles, isEmpty);
    expect(snapshot.activeProfileId, isNull);
  });

  test('unsafe profile creation POST is sent once', () async {
    var posts = 0;
    final repository = _repository((request) async {
      if (request.method == 'POST') {
        posts++;
        return http.Response(
          jsonEncode({
            'error': {
              'code': 'UNAVAILABLE',
              'message': 'Unavailable',
              'requestId': 'request-1',
              'retryable': true,
              'fieldErrors': [],
            },
          }),
          503,
        );
      }
      return http.Response('{}', 500);
    });
    await expectLater(
      repository.add(
        PatientProfileDraft(
          relationship: PatientRelationship.me,
          firstName: 'Ari',
          lastName: 'Ahmed',
          gender: PatientGender.male,
          dateOfBirth: DateTime(2000),
        ),
      ),
      throwsA(anything),
    );
    expect(posts, 1);
  });
}

BackendPatientProfilesRepository _repository(
  Future<http.Response> Function(http.Request) handler,
) {
  final storage = _Storage();
  final api = ApiClient(
    configuration: AppConfiguration.fromValues(
      environment: 'development',
      apiBaseUrl: 'http://localhost:3000',
    ),
    client: MockClient(handler),
  );
  return BackendPatientProfilesRepository(
    AuthenticatedApiClient(
      api: api,
      storage: storage,
      refresh: () async => (await storage.read())!,
    ),
  );
}

class _Storage implements SessionStorage {
  final StoredSession session = StoredSession(
    phoneNumber: '+9647501234567',
    expiresAt: DateTime.now().toUtc().add(const Duration(hours: 1)),
    accessToken: List.filled(32, 'a').join(),
    refreshToken: List.filled(32, 'r').join(),
    deviceId: '00000000-0000-4000-8000-000000000003',
  );
  @override
  Future<void> clear() async {}
  @override
  Future<StoredSession?> read() async => session;
  @override
  Future<void> write(StoredSession session) async {}
}
