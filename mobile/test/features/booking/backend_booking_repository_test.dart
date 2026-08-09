import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:saxlem_app/config/environment/app_configuration.dart';
import 'package:saxlem_app/core/models/patient_profile.dart';
import 'package:saxlem_app/core/network/api_client.dart';
import 'package:saxlem_app/core/network/authenticated_api_client.dart';
import 'package:saxlem_app/features/authentication/domain/repositories/auth_repository.dart';
import 'package:saxlem_app/features/booking/data/repositories/backend_booking_repository.dart';
import 'package:saxlem_app/features/booking/data/dto/booking_options_response_dto.dart';
import 'package:saxlem_app/features/booking/domain/entities/appointment_slot.dart';
import 'package:saxlem_app/features/booking/domain/entities/booking_draft.dart';
import 'package:saxlem_app/features/booking/domain/entities/booking_types.dart';
import 'package:saxlem_app/features/booking/domain/repositories/booking_repository.dart';

void main() {
  test(
    'serializes exact options query and authoritative create body',
    () async {
      final requests = <http.Request>[];
      final repository = _repository(
        MockClient((request) async {
          requests.add(request);
          if (request.method == 'GET') {
            return http.Response(jsonEncode(_options()), 200);
          }
          return http.Response(jsonEncode(_appointment()), 201);
        }),
      );
      final options = await repository.loadOptions(
        BookingOptionsRequest(
          doctorId: doctorId,
          clinicId: clinicId,
          patientProfileId: profileId,
          appointmentType: BookingAppointmentType.initial,
          dateFrom: DateTime.utc(2030, 8, 10),
          dateTo: DateTime.utc(2030, 8, 11),
        ),
      );
      final confirmation = await repository.create(
        BookingDraft(
          options: options,
          profileId: const PatientProfileId(profileId),
          reason: 'Consultation',
          slot: options.days.first.slots.single,
        ),
        'booking-0123456789abcdef',
      );
      expect(
        requests.first.url.path,
        '/api/v1/doctors/$doctorId/booking-options',
      );
      expect(requests.first.url.queryParameters, {
        'clinicId': clinicId,
        'patientProfileId': profileId,
        'appointmentType': 'initial',
        'dateFrom': '2030-08-10',
        'dateTo': '2030-08-11',
      });
      expect(jsonDecode(requests.last.body), {
        'organizationId': organizationId,
        'clinicId': clinicId,
        'doctorId': doctorId,
        'patientProfileId': profileId,
        'type': 'initial',
        'reason': 'Consultation',
        'startsAt': '2030-08-10T06:00:00.000Z',
        'durationMinutes': 30,
      });
      expect(
        requests.last.headers['idempotency-key'],
        'booking-0123456789abcdef',
      );
      expect(requests.last.body, isNot(contains('feeIqd')));
      expect(confirmation.reference, 'SX-2030-000001');
      expect(confirmation.clinicTimezone, 'Asia/Baghdad');
    },
  );

  test('invalid UUID is rejected before network access', () async {
    var calls = 0;
    final repository = _repository(
      MockClient((_) async {
        calls++;
        return http.Response('{}', 200);
      }),
    );
    await expectLater(
      repository.loadOptions(
        BookingOptionsRequest(
          doctorId: 'bad',
          clinicId: clinicId,
          patientProfileId: profileId,
          appointmentType: BookingAppointmentType.initial,
          dateFrom: DateTime.utc(2030, 8, 10),
          dateTo: DateTime.utc(2030, 8, 11),
        ),
      ),
      throwsA(isA<BookingFailure>()),
    );
    expect(calls, 0);
  });

  test(
    'date-only window bounds cannot be bypassed by time components',
    () async {
      var calls = 0;
      final repository = _repository(
        MockClient((_) async {
          calls++;
          return http.Response('{}', 200);
        }),
      );
      await expectLater(
        repository.loadOptions(
          BookingOptionsRequest(
            doctorId: doctorId,
            clinicId: clinicId,
            patientProfileId: profileId,
            appointmentType: BookingAppointmentType.initial,
            dateFrom: DateTime.utc(2030, 8, 1, 23),
            dateTo: DateTime.utc(2030, 9, 1),
          ),
        ),
        throwsA(isA<BookingFailure>()),
      );
      expect(calls, 0);
    },
  );

  test('options response must match the requested doctor and clinic', () async {
    final repository = _repository(
      MockClient((_) async {
        final body = _options()..['clinicId'] = organizationId;
        return http.Response(jsonEncode(body), 200);
      }),
    );
    await expectLater(
      repository.loadOptions(
        BookingOptionsRequest(
          doctorId: doctorId,
          clinicId: clinicId,
          patientProfileId: profileId,
          appointmentType: BookingAppointmentType.initial,
          dateFrom: DateTime.utc(2030, 8, 10),
          dateTo: DateTime.utc(2030, 8, 11),
        ),
      ),
      throwsA(
        predicate(
          (error) =>
              error is BookingFailure &&
              error.problem == BookingProblem.malformedResponse,
        ),
      ),
    );
  });

  test('create rejects a slot not present in authoritative options', () async {
    var calls = 0;
    final repository = _repository(
      MockClient((_) async {
        calls++;
        return http.Response('{}', 201);
      }),
    );
    final options = BookingOptionsResponseDto.parse(_options());
    await expectLater(
      repository.create(
        BookingDraft(
          options: options,
          profileId: const PatientProfileId(profileId),
          reason: 'Consultation',
          slot: AppointmentSlot(
            startsAt: DateTime.utc(2030, 8, 10, 7),
            endsAt: DateTime.utc(2030, 8, 10, 7, 30),
            durationMinutes: 30,
          ),
        ),
        'booking-0123456789abcdef',
      ),
      throwsA(isA<BookingFailure>()),
    );
    expect(calls, 0);
  });

  test('unknown POST outcome is not automatically replayed', () async {
    var calls = 0;
    final repository = _repository(
      MockClient((_) async {
        calls++;
        throw http.ClientException('offline secret');
      }),
    );
    final options = BookingOptionsResponseDto.parse(_options());
    await expectLater(
      repository.create(
        BookingDraft(
          options: options,
          profileId: const PatientProfileId(profileId),
          reason: 'Consultation',
          slot: options.days.first.slots.single,
        ),
        'booking-0123456789abcdef',
      ),
      throwsA(
        predicate(
          (error) =>
              error is BookingFailure &&
              error.problem == BookingProblem.unknownOutcome,
        ),
      ),
    );
    expect(calls, 1);
  });
}

BackendBookingRepository _repository(http.Client client) {
  final storage = _Storage();
  return BackendBookingRepository(
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

const doctorId = '00000000-0000-4000-8000-000000000001';
const organizationId = '00000000-0000-4000-8000-000000000002';
const clinicId = '00000000-0000-4000-8000-000000000003';
const profileId = '00000000-0000-4000-8000-000000000004';
Map<String, dynamic> _options() => {
  'doctorId': doctorId,
  'doctorName': 'Doctor',
  'organizationId': organizationId,
  'clinicId': clinicId,
  'clinicName': 'Clinic',
  'clinicTimezone': 'Asia/Baghdad',
  'appointmentType': 'initial',
  'durationMinutes': 30,
  'feeIqd': 35000,
  'currency': 'IQD',
  'dateFrom': '2030-08-10',
  'dateTo': '2030-08-11',
  'days': [
    {
      'date': '2030-08-10',
      'slots': [
        {
          'startsAt': '2030-08-10T06:00:00.000Z',
          'endsAt': '2030-08-10T06:30:00.000Z',
          'durationMinutes': 30,
        },
      ],
    },
    {'date': '2030-08-11', 'slots': []},
  ],
  'generatedAt': '2030-08-09T20:00:00.000Z',
};
Map<String, dynamic> _appointment() => {
  'id': '00000000-0000-4000-8000-000000000005',
  'reference': 'SX-2030-000001',
  'clinicId': clinicId,
  'clinicName': 'Clinic',
  'doctorId': doctorId,
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
  'version': 1,
};
