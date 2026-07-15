import 'app_environment.dart';

class AppConfiguration {
  const AppConfiguration._(this.environment, this._allowQaMockAuthentication);

  factory AppConfiguration.fromCompileTime() => AppConfiguration.fromValues(
    environment: const String.fromEnvironment('SAXLEM_ENV'),
    allowMockAuthentication: const bool.fromEnvironment(
      'SAXLEM_ALLOW_MOCK_AUTH',
    ),
  );

  factory AppConfiguration.fromValues({
    required String environment,
    bool allowMockAuthentication = false,
  }) {
    final resolved = switch (environment.trim().toLowerCase()) {
      'development' => AppEnvironment.development,
      'qa' => AppEnvironment.qa,
      'production' => AppEnvironment.production,
      _ => AppEnvironment.production,
    };
    return AppConfiguration._(
      resolved,
      resolved == AppEnvironment.qa && allowMockAuthentication,
    );
  }

  final AppEnvironment environment;
  final bool _allowQaMockAuthentication;

  bool get allowMockAuthentication =>
      environment == AppEnvironment.development ||
      (environment == AppEnvironment.qa && _allowQaMockAuthentication);

  bool get isProduction => environment == AppEnvironment.production;
}
