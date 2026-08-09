import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:saxlem_app/app/app_dependencies.dart';
import 'package:saxlem_app/config/environment/app_configuration.dart';
import 'package:saxlem_app/config/environment/app_environment.dart';
import 'package:saxlem_app/core/device/device_identity.dart';
import 'package:saxlem_app/core/network/api_client.dart';
import 'package:saxlem_app/features/authentication/data/repositories/backend_auth_repository.dart';
import 'package:saxlem_app/features/authentication/data/repositories/mock_auth_repository.dart';
import 'package:saxlem_app/features/authentication/data/repositories/unavailable_auth_repository.dart';
import 'package:saxlem_app/features/authentication/domain/repositories/auth_repository.dart';
import 'package:saxlem_app/features/authentication/presentation/authentication_feature.dart';
import 'package:saxlem_app/features/family_profiles/data/repositories/backend_patient_profiles_repository.dart';
import 'package:saxlem_app/features/family_profiles/data/repositories/in_memory_patient_profiles_repository.dart';
import 'package:saxlem_app/l10n/app_localizations.dart';
import 'package:saxlem_app/features/discover/data/repositories/backend_doctor_discovery_repository.dart';
import 'package:saxlem_app/features/discover/data/repositories/unavailable_doctor_discovery_repository.dart';
import 'package:saxlem_app/features/booking/data/repositories/backend_booking_repository.dart';
import 'package:saxlem_app/features/appointments/data/repositories/backend_patient_appointments_repository.dart';

void main() {
  group('production-safe composition', () {
    test('missing environment defaults to production with no mock', () {
      final configuration = AppConfiguration.fromValues(environment: '');
      final dependencies = _create(configuration);

      expect(configuration.environment, AppEnvironment.production);
      expect(configuration.allowMockAuthentication, isFalse);
      expect(dependencies.authRepository, isA<UnavailableAuthRepository>());
      expect(dependencies.authRepository, isNot(isA<MockAuthRepository>()));
      expect(dependencies.developmentOtp, isNull);
      expect(
        dependencies.doctorDiscoveryRepository,
        isA<UnavailableDoctorDiscoveryRepository>(),
      );
    });

    test('unknown environment defaults to production with no mock', () {
      final configuration = AppConfiguration.fromValues(
        environment: 'unexpected',
        allowMockAuthentication: true,
      );
      final dependencies = _create(configuration);

      expect(configuration.environment, AppEnvironment.production);
      expect(configuration.allowMockAuthentication, isFalse);
      expect(dependencies.authRepository, isA<UnavailableAuthRepository>());
      expect(dependencies.developmentOtp, isNull);
      expect(
        dependencies.doctorDiscoveryRepository,
        isA<UnavailableDoctorDiscoveryRepository>(),
      );
    });

    test('production can never enable mock authentication', () {
      final configuration = AppConfiguration.fromValues(
        environment: 'production',
        allowMockAuthentication: true,
      );

      expect(configuration.allowMockAuthentication, isFalse);
      expect(
        _create(configuration).authRepository,
        isA<UnavailableAuthRepository>(),
      );
    });

    test('production with valid API configuration uses backend repository', () {
      final configuration = AppConfiguration.fromValues(
        environment: 'production',
        apiBaseUrl: 'https://api.saxlem.test',
      );
      final dependencies = AppDependencies.create(
        configuration: configuration,
        sessionStorage: _MemorySessionStorage(),
        deviceIdentity: const _FakeDeviceIdentity(),
        apiClient: ApiClient(
          configuration: configuration,
          client: MockClient((_) async => http.Response('{}', 500)),
        ),
      );

      expect(dependencies.authRepository, isA<BackendAuthRepository>());
      expect(
        dependencies.patientProfilesRepository,
        isA<BackendPatientProfilesRepository>(),
      );
      expect(
        dependencies.patientProfilesRepository,
        isNot(isA<InMemoryPatientProfilesRepository>()),
      );
      expect(dependencies.authRepository, isNot(isA<MockAuthRepository>()));
      expect(dependencies.developmentOtp, isNull);
      expect(
        dependencies.doctorDiscoveryRepository,
        isA<BackendDoctorDiscoveryRepository>(),
      );
      expect(dependencies.bookingRepository, isA<BackendBookingRepository>());
      expect(
        dependencies.appointmentsRepository,
        isA<BackendPatientAppointmentsRepository>(),
      );
    });

    test('development explicitly enables the mock repository', () {
      final dependencies = _create(
        AppConfiguration.fromValues(environment: 'development'),
      );

      expect(dependencies.authRepository, isA<MockAuthRepository>());
      expect(dependencies.developmentOtp, isNotNull);
    });

    test('QA requires explicit mock opt-in', () {
      expect(
        _create(AppConfiguration.fromValues(environment: 'qa')).authRepository,
        isA<UnavailableAuthRepository>(),
      );
      expect(
        _create(
          AppConfiguration.fromValues(
            environment: 'qa',
            allowMockAuthentication: true,
          ),
        ).authRepository,
        isA<MockAuthRepository>(),
      );
    });
  });

  testWidgets('production clearly reports unavailable authentication', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: AuthenticationFeature(
          repository: const UnavailableAuthRepository(),
          onAuthenticated: (_) {},
          onGuest: () {},
        ),
      ),
    );

    await tester.ensureVisible(find.text('Continue'));
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField), '07501234567');
    await tester.tap(find.text('Send code'));
    await tester.pump();

    expect(
      find.text('Phone verification is not available in this build yet.'),
      findsOneWidget,
    );
    expect(find.text('Enter your code'), findsNothing);
  });
}

AppDependencies _create(AppConfiguration configuration) =>
    AppDependencies.create(
      configuration: configuration,
      sessionStorage: _MemorySessionStorage(),
    );

class _MemorySessionStorage implements SessionStorage {
  StoredSession? value;

  @override
  Future<void> clear() async => value = null;

  @override
  Future<StoredSession?> read() async => value;

  @override
  Future<void> write(StoredSession session) async => value = session;
}

class _FakeDeviceIdentity implements DeviceIdentity {
  const _FakeDeviceIdentity();

  @override
  Future<String> identifier() async => '00000000-0000-4000-8000-000000000001';

  @override
  String get platform => 'android';
}
