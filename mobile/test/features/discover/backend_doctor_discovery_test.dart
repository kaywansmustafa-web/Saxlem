import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:saxlem_app/config/environment/app_configuration.dart';
import 'package:saxlem_app/core/network/api_client.dart';
import 'package:saxlem_app/core/network/authenticated_api_client.dart';
import 'package:saxlem_app/features/authentication/domain/repositories/auth_repository.dart';
import 'package:saxlem_app/features/discover/data/dto/backend_doctor_discovery_dto.dart';
import 'package:saxlem_app/features/discover/data/repositories/backend_doctor_discovery_repository.dart';
import 'package:saxlem_app/features/discover/domain/entities/doctor_search_criteria.dart';

void main() {
  const parser = BackendDoctorDiscoveryParser();
  test('strict parser accepts authoritative page and detail', () {
    final page = parser.page(_pageJson());
    expect(page.results.single.doctorId, _doctorId);
    expect(
      parser.doctor(_doctorJson(detail: true), detail: true).biography,
      'Biography',
    );
  });
  test(
    'strict parser rejects malformed UUID, enum, integer and extra shape',
    () {
      for (final mutation in <void Function(Map<String, dynamic>)>[
        (json) => (json['items'] as List).first['id'] = 'synthetic',
        (json) => (json['items'] as List).first['gender'] = 'other',
        (json) => (json['items'] as List).first['yearsOfExperience'] = 1.5,
        (json) => json['unexpected'] = true,
      ]) {
        final json = _pageJson();
        mutation(json);
        expect(
          () => parser.page(json),
          throwsA(isA<DoctorContractException>()),
        );
      }
    },
  );
  test('strict parser rejects duplicate doctors and malformed pagination', () {
    final duplicate = _pageJson();
    (duplicate['items'] as List).add(_doctorJson());
    expect(
      () => parser.page(duplicate),
      throwsA(isA<DoctorContractException>()),
    );
    final malformed = _pageJson()..['pageSize'] = 0;
    expect(
      () => parser.page(malformed),
      throwsA(isA<DoctorContractException>()),
    );
  });
  test('discovery options validate bounds, nullability and uniqueness', () {
    final options = parser.options(_optionsJson());
    expect(options.minimumExperience, 2);
    final malformed = _optionsJson();
    malformed['experience'] = <String, dynamic>{'minimum': 2, 'maximum': null};
    expect(
      () => parser.options(malformed),
      throwsA(isA<DoctorContractException>()),
    );
  });
  test('repository serializes only exact supported query parameters', () async {
    late http.Request captured;
    final repository = _repository(
      MockClient((request) async {
        captured = request;
        return http.Response(
          jsonEncode(_pageJson()),
          200,
          headers: {'content-type': 'application/json'},
        );
      }),
    );
    await repository.search(
      const DoctorSearchCriteria(
        query: '  Shilan  ',
        specialtyCode: 'cardiology',
        clinicId: _clinicId,
        language: 'english',
        minimumYearsOfExperience: 4,
      ),
      page: 2,
      pageSize: 20,
    );
    expect(captured.url.queryParameters, {
      'name': 'Shilan',
      'specialty': 'cardiology',
      'clinicId': _clinicId,
      'language': 'english',
      'minimumYearsOfExperience': '4',
      'page': '2',
      'pageSize': '20',
    });
    expect(captured.url.queryParameters, isNot(contains('patientProfileId')));
  });
  test('invalid clinic ID fails before network request', () async {
    var called = false;
    final repository = _repository(
      MockClient((_) async {
        called = true;
        return http.Response('{}', 200);
      }),
    );
    expect(
      () => repository.search(
        const DoctorSearchCriteria(clinicId: 'bad'),
        page: 1,
      ),
      throwsA(isA<Exception>()),
    );
    expect(called, isFalse);
  });
  test(
    'detail reload validates detail, profile, specialties and availability',
    () async {
      final paths = <String>[];
      final repository = _repository(
        MockClient((request) async {
          paths.add(request.url.path);
          final body = switch (request.url.path) {
            '/api/v1/doctors/$_doctorId' => _doctorJson(detail: true),
            '/api/v1/doctors/$_doctorId/profile' => _profileJson(),
            '/api/v1/doctors/$_doctorId/specialties' => [_specialtyJson()],
            '/api/v1/doctors/$_doctorId/availability' =>
              _scheduleAvailabilityJson(),
            _ => <String, dynamic>{},
          };
          return http.Response(
            jsonEncode(body),
            200,
            headers: {'content-type': 'application/json'},
          );
        }),
      );
      final doctor = await repository.loadDoctor(_doctorId);
      expect(doctor.doctorId, _doctorId);
      expect(paths, [
        '/api/v1/doctors/$_doctorId',
        '/api/v1/doctors/$_doctorId/profile',
        '/api/v1/doctors/$_doctorId/specialties',
        '/api/v1/doctors/$_doctorId/availability',
      ]);
    },
  );
  test(
    'backend response bodies and search terms are absent from failures',
    () async {
      final repository = _repository(
        MockClient(
          (_) async => http.Response(
            jsonEncode({
              'error': {
                'code': 'FORBIDDEN',
                'message': 'secret Shilan',
                'requestId': 'request',
                'retryable': false,
                'fieldErrors': [],
              },
            }),
            403,
          ),
        ),
      );
      try {
        await repository.search(
          const DoctorSearchCriteria(query: 'Shilan'),
          page: 1,
        );
        fail('Expected failure');
      } catch (error) {
        expect(error.toString(), isNot(contains('Shilan')));
        expect(error.toString(), isNot(contains('secret')));
      }
    },
  );
}

BackendDoctorDiscoveryRepository _repository(http.Client client) {
  final storage = _Storage();
  final api = ApiClient(
    configuration: AppConfiguration.fromValues(
      environment: 'production',
      apiBaseUrl: 'https://api.saxlem.test',
    ),
    client: client,
  );
  return BackendDoctorDiscoveryRepository(
    AuthenticatedApiClient(
      api: api,
      storage: storage,
      refresh: () async => storage.value,
    ),
  );
}

class _Storage implements SessionStorage {
  final value = StoredSession(
    userId: 'user',
    phoneNumber: '+9647500000000',
    expiresAt: DateTime.now().toUtc().add(const Duration(hours: 1)),
    accessToken: 'access',
    refreshToken: 'refresh',
    deviceId: 'device',
  );
  @override
  Future<void> clear() async {}
  @override
  Future<StoredSession?> read() async => value;
  @override
  Future<void> write(StoredSession session) async {}
}

const _doctorId = '00000000-0000-4000-8000-000000000001';
const _clinicId = '00000000-0000-4000-8000-000000000010';
Map<String, dynamic> _availability() => {
  'status': 'available',
  'acceptingNewPatients': true,
  'nextAvailableAt': null,
  'updatedAt': null,
};
Map<String, dynamic> _doctorJson({bool detail = false}) => {
  'id': _doctorId,
  'displayName': 'Dr Shilan',
  'fullName': 'Dr Shilan',
  'specialty': 'Cardiology',
  'gender': 'female',
  'status': 'active',
  'yearsOfExperience': 12,
  'languages': ['english'],
  'profileImageUrl': null,
  'clinics': [
    {'id': _clinicId, 'name': 'Clinic'},
  ],
  'availability': _availability(),
  if (detail) ...{
    'firstName': 'Shilan',
    'lastName': 'Ahmed',
    'licenseNumber': 'LICENSE-1',
    'biography': 'Biography',
    'specialties': [
      {
        'id': '00000000-0000-4000-8000-000000000020',
        'code': 'cardiology',
        'displayName': 'Cardiology',
        'isPrimary': true,
      },
    ],
  },
};
Map<String, dynamic> _pageJson() => {
  'items': [_doctorJson()],
  'page': 1,
  'pageSize': 20,
  'total': 1,
  'totalPages': 1,
};
Map<String, dynamic> _optionsJson() => {
  'specialties': [
    {'code': 'cardiology', 'displayName': 'Cardiology'},
  ],
  'clinics': [
    {'id': _clinicId, 'name': 'Clinic'},
  ],
  'languages': ['english'],
  'genders': ['female'],
  'experience': {'minimum': 2, 'maximum': 20},
};
Map<String, dynamic> _specialtyJson() => {
  'id': '00000000-0000-4000-8000-000000000020',
  'code': 'cardiology',
  'displayName': 'Cardiology',
  'isPrimary': true,
};
Map<String, dynamic> _profileJson() => {
  'id': _doctorId,
  'displayName': 'Dr Shilan',
  'fullName': 'Dr Shilan',
  'specialty': 'Cardiology',
  'gender': 'female',
  'licenseNumber': 'LICENSE-1',
  'yearsOfExperience': 12,
  'biography': 'Biography',
  'languages': ['english'],
  'profileImageUrl': null,
  'specialties': [_specialtyJson()],
};
Map<String, dynamic> _scheduleAvailabilityJson() => {
  'doctorId': _doctorId,
  'evaluatedAt': '2026-08-05T08:00:00.000Z',
  'clinics': [
    {
      'clinicId': _clinicId,
      'clinicName': 'Clinic',
      'timezone': 'Asia/Baghdad',
      'localDate': '2026-08-05',
      'status': 'workingToday',
      'isWorkingNow': true,
    },
  ],
};
