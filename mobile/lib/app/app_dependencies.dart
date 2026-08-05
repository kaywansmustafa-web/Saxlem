import 'package:http/http.dart' as http;

import '../config/environment/app_configuration.dart';
import '../core/device/device_identity.dart';
import '../core/network/api_client.dart';
import '../core/network/authenticated_api_client.dart';
import '../core/network/refresh_coordinator.dart';
import '../features/authentication/data/repositories/backend_auth_repository.dart';
import '../features/authentication/data/repositories/mock_auth_repository.dart';
import '../features/authentication/data/repositories/unavailable_auth_repository.dart';
import '../features/authentication/domain/repositories/auth_repository.dart';
import '../features/family_profiles/data/repositories/backend_patient_profiles_repository.dart';
import '../features/family_profiles/data/repositories/in_memory_patient_profiles_repository.dart';
import '../features/family_profiles/domain/repositories/patient_profiles_repository.dart';

class AppDependencies {
  const AppDependencies({
    required this.authRepository,
    this.patientProfilesRepository,
    this.developmentOtp,
  });

  factory AppDependencies.create({
    required AppConfiguration configuration,
    required SessionStorage sessionStorage,
    DeviceIdentity? deviceIdentity,
    ApiClient? apiClient,
  }) {
    if (configuration.allowMockAuthentication) {
      return AppDependencies(
        authRepository: MockAuthRepository(sessionStorage),
        patientProfilesRepository: InMemoryPatientProfilesRepository(),
        developmentOtp: MockAuthRepository.developmentOtp,
      );
    }
    if (!configuration.hasValidApiConfiguration || deviceIdentity == null) {
      return const AppDependencies(authRepository: UnavailableAuthRepository());
    }
    final api =
        apiClient ??
        ApiClient(configuration: configuration, client: http.Client());
    final refreshCoordinator = RefreshCoordinator<StoredSession>();
    late final BackendAuthRepository auth;
    auth = BackendAuthRepository(
      api: api,
      storage: sessionStorage,
      deviceIdentity: deviceIdentity,
      environment: configuration.environment,
      refreshCoordinator: refreshCoordinator,
    );
    return AppDependencies(
      authRepository: auth,
      patientProfilesRepository: BackendPatientProfilesRepository(
        AuthenticatedApiClient(
          api: api,
          storage: sessionStorage,
          refreshCoordinator: refreshCoordinator,
          refresh: auth.refreshSession,
        ),
      ),
    );
  }

  final AuthRepository authRepository;
  final PatientProfilesRepository? patientProfilesRepository;
  final String? developmentOtp;
}
