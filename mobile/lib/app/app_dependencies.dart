import '../config/environment/app_configuration.dart';
import '../features/authentication/data/repositories/mock_auth_repository.dart';
import '../features/authentication/data/repositories/unavailable_auth_repository.dart';
import '../features/authentication/domain/repositories/auth_repository.dart';

class AppDependencies {
  const AppDependencies({required this.authRepository, this.developmentOtp});

  factory AppDependencies.create({
    required AppConfiguration configuration,
    required SessionStorage sessionStorage,
  }) {
    if (!configuration.allowMockAuthentication) {
      return const AppDependencies(authRepository: UnavailableAuthRepository());
    }
    return AppDependencies(
      authRepository: MockAuthRepository(sessionStorage),
      developmentOtp: MockAuthRepository.developmentOtp,
    );
  }

  final AuthRepository authRepository;
  final String? developmentOtp;
}
