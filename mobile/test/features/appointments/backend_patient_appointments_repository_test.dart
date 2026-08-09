import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:saxlem_app/config/environment/app_configuration.dart';
import 'package:saxlem_app/core/models/patient_profile.dart';
import 'package:saxlem_app/core/network/api_client.dart';
import 'package:saxlem_app/core/network/authenticated_api_client.dart';
import 'package:saxlem_app/features/appointments/data/repositories/backend_patient_appointments_repository.dart';
import 'package:saxlem_app/features/appointments/domain/entities/patient_appointment.dart';
import 'package:saxlem_app/features/appointments/domain/repositories/patient_appointments_repository.dart';
import 'package:saxlem_app/features/authentication/domain/repositories/auth_repository.dart';

void main() {
  test('serializes selected-profile list and cursor exactly', () async {
    late http.Request captured;
    final repository = _repository(
      MockClient((request) async {
        captured = request;
        return http.Response(
          jsonEncode({
            'items': [_appointment()],
            'nextCursor': appointmentId,
          }),
          200,
        );
      }),
    );
    final page = await repository.list(
      AppointmentListRequest(
        profileId: const PatientProfileId(profileId),
        from: DateTime.utc(2030, 1, 1),
        to: DateTime.utc(2030, 12, 31),
        status: PatientAppointmentStatus.scheduled,
        cursor: appointmentId,
      ),
    );
    expect(captured.url.path, '/api/v1/appointments');
    expect(captured.url.queryParameters, {
      'patientProfileId': profileId,
      'from': '2030-01-01T00:00:00.000Z',
      'to': '2030-12-31T00:00:00.000Z',
      'pageSize': '25',
      'status': 'scheduled',
      'cursor': appointmentId,
    });
    expect(page.items.single.profileId.value, profileId);
  });

  test('invalid profile and oversized window fail before network', () async {
    var calls = 0;
    final repository = _repository(
      MockClient((_) async {
        calls++;
        return http.Response('{}', 200);
      }),
    );
    await expectLater(
      repository.list(
        AppointmentListRequest(
          profileId: const PatientProfileId('invalid'),
          from: DateTime.utc(2030),
          to: DateTime.utc(2031, 1, 2),
          status: PatientAppointmentStatus.scheduled,
        ),
      ),
      throwsA(isA<AppointmentFailure>()),
    );
    expect(calls, 0);
  });

  test('detail fails closed on another patient profile', () async {
    final repository = _repository(
      MockClient(
        (_) async => http.Response(
          jsonEncode(_appointment()..['patientProfileId'] = otherProfileId),
          200,
        ),
      ),
    );
    await expectLater(
      repository.detail(appointmentId, const PatientProfileId(profileId)),
      throwsA(
        predicate(
          (error) =>
              error is AppointmentFailure &&
              error.problem == AppointmentProblem.malformed,
        ),
      ),
    );
  });

  test(
    'cancel and reschedule send exact versioned idempotent commands',
    () async {
      final requests = <http.Request>[];
      final repository = _repository(
        MockClient((request) async {
          requests.add(request);
          final response = _appointment();
          response['version'] = 3;
          if (request.url.path.endsWith('/cancel')) {
            response['status'] = 'cancelled';
            response['cancellationReason'] = 'Travel';
          } else {
            response['startsAt'] = '2030-08-11T06:00:00.000Z';
            response['endsAt'] = '2030-08-11T06:30:00.000Z';
          }
          return http.Response(jsonEncode(response), 200);
        }),
      );
      await repository.cancel(
        const AppointmentCancellation(
          appointmentId: appointmentId,
          profileId: PatientProfileId(profileId),
          reason: 'Travel',
          version: 2,
        ),
        'appointment-operation-1',
      );
      await repository.reschedule(
        AppointmentReschedule(
          appointmentId: appointmentId,
          profileId: const PatientProfileId(profileId),
          startsAt: DateTime.utc(2030, 8, 11, 6),
          durationMinutes: 30,
          version: 2,
        ),
        'appointment-operation-2',
      );
      expect(jsonDecode(requests.first.body), {
        'reason': 'Travel',
        'version': 2,
      });
      expect(jsonDecode(requests.last.body), {
        'startsAt': '2030-08-11T06:00:00.000Z',
        'durationMinutes': 30,
        'version': 2,
      });
      expect(
        requests.first.headers['idempotency-key'],
        'appointment-operation-1',
      );
      expect(
        requests.last.headers['idempotency-key'],
        'appointment-operation-2',
      );
    },
  );
}

BackendPatientAppointmentsRepository _repository(http.Client client) {
  final storage = _Storage();
  return BackendPatientAppointmentsRepository(
    AuthenticatedApiClient(
      api: ApiClient(
        configuration: AppConfiguration.fromValues(
          environment: 'production',
          apiBaseUrl: 'https://api.saxlem.test',
        ),
        client: client,
      ),
      storage: storage,
      refresh: () async => storage.session,
    ),
  );
}

class _Storage implements SessionStorage {
  final session = StoredSession(
    phoneNumber: '+9647500000000',
    expiresAt: DateTime.utc(2031),
    accessToken: 'access',
    refreshToken: 'refresh',
    deviceId: '00000000-0000-4000-8000-000000000009',
  );
  @override
  Future<void> clear() async {}
  @override
  Future<StoredSession?> read() async => session;
  @override
  Future<void> write(StoredSession session) async {}
}

const appointmentId = '00000000-0000-4000-8000-000000000001';
const profileId = '00000000-0000-4000-8000-000000000004';
const otherProfileId = '00000000-0000-4000-8000-000000000005';
Map<String, dynamic> _appointment() => {
  'id': appointmentId,
  'reference': 'SX-2030-000001',
  'clinicId': '00000000-0000-4000-8000-000000000002',
  'clinicName': 'Clinic',
  'doctorId': '00000000-0000-4000-8000-000000000003',
  'doctorName': 'Doctor',
  'patientProfileId': profileId,
  'patientName': 'Patient',
  'type': 'initial',
  'reason': 'Consultation',
  'startsAt': '2030-08-10T06:00:00.000Z',
  'endsAt': '2030-08-10T06:30:00.000Z',
  'durationMinutes': 30,
  'feeIqd': 35000,
  'status': 'scheduled',
  'cancellationReason': null,
  'version': 2,
};
