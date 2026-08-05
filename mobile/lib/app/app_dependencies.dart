import 'package:http/http.dart' as http;

import '../config/environment/app_configuration.dart';
import '../core/device/device_identity.dart';
import '../core/network/api_client.dart';
import '../features/authentication/data/repositories/backend_auth_repository.dart';
import '../features/authentication/data/repositories/mock_auth_repository.dart';
import '../features/authentication/data/repositories/unavailable_auth_repository.dart';
import '../features/authentication/domain/repositories/auth_repository.dart';

class AppDependencies {
  const AppDependencies({required this.authRepository, this.developmentOtp});

  factory AppDependencies.create({
    required AppConfiguration configuration,
    required SessionStorage sessionStorage,
    DeviceIdentity? deviceIdentity,
    ApiClient? apiClient,
  }) {
    if (configuration.allowMockAuthentication) {
      return AppDependencies(
        authRepository: MockAuthRepository(sessionStorage),
        developmentOtp: MockAuthRepository.developmentOtp,
      );
    }
    if (!configuration.hasValidApiConfiguration || deviceIdentity == null) {
      return const AppDependencies(authRepository: UnavailableAuthRepository());
    }
    return AppDependencies(
      authRepository: BackendAuthRepository(
        api:
            apiClient ??
            ApiClient(configuration: configuration, client: http.Client()),
        storage: sessionStorage,
        deviceIdentity: deviceIdentity,
        environment: configuration.environment,
      ),
    );
  }

  final AuthRepository authRepository;
  final String? developmentOtp;
}
