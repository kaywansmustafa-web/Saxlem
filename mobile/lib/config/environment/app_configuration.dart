import 'app_environment.dart';

class AppConfiguration {
  const AppConfiguration._(
    this.environment,
    this._allowQaMockAuthentication,
    this._apiV1BaseUri,
    this._apiTimeout,
  );

  static const int defaultApiTimeoutSeconds = 15;
  static const int minimumApiTimeoutSeconds = 1;
  static const int maximumApiTimeoutSeconds = 60;

  factory AppConfiguration.fromCompileTime() => AppConfiguration.fromValues(
    environment: const String.fromEnvironment('SAXLEM_ENV'),
    allowMockAuthentication: const bool.fromEnvironment(
      'SAXLEM_ALLOW_MOCK_AUTH',
    ),
    apiBaseUrl: const String.fromEnvironment('SAXLEM_API_BASE_URL'),
    apiTimeoutSeconds: const String.fromEnvironment(
      'SAXLEM_API_TIMEOUT_SECONDS',
      defaultValue: '$defaultApiTimeoutSeconds',
    ),
  );

  factory AppConfiguration.fromValues({
    required String environment,
    bool allowMockAuthentication = false,
    String apiBaseUrl = '',
    String apiTimeoutSeconds = '$defaultApiTimeoutSeconds',
  }) {
    final resolved = switch (environment.trim().toLowerCase()) {
      'development' => AppEnvironment.development,
      'qa' => AppEnvironment.qa,
      'production' => AppEnvironment.production,
      _ => AppEnvironment.production,
    };
    final timeout = _parseTimeout(apiTimeoutSeconds);
    final baseUri = _parseApiBaseUri(apiBaseUrl, resolved);
    return AppConfiguration._(
      resolved,
      resolved == AppEnvironment.qa && allowMockAuthentication,
      timeout == null ? null : baseUri,
      timeout == null || baseUri == null ? null : Duration(seconds: timeout),
    );
  }

  final AppEnvironment environment;
  final bool _allowQaMockAuthentication;
  final Uri? _apiV1BaseUri;
  final Duration? _apiTimeout;

  bool get allowMockAuthentication =>
      environment == AppEnvironment.development ||
      (environment == AppEnvironment.qa && _allowQaMockAuthentication);

  bool get isProduction => environment == AppEnvironment.production;

  bool get hasValidApiConfiguration =>
      _apiV1BaseUri != null && _apiTimeout != null;

  Uri get apiV1BaseUri =>
      _apiV1BaseUri ??
      (throw StateError('The API configuration is unavailable.'));

  Duration get apiTimeout =>
      _apiTimeout ??
      (throw StateError('The API configuration is unavailable.'));

  Uri apiEndpoint(String relativePath) {
    final path = relativePath.trim();
    final parsed = Uri.tryParse(path);
    final unversionedPath = path.startsWith('/') ? path.substring(1) : path;
    if (path.isEmpty ||
        path.startsWith('//') ||
        path.contains(r'\') ||
        unversionedPath == 'api/v1' ||
        unversionedPath.startsWith('api/v1/') ||
        parsed == null ||
        parsed.isAbsolute ||
        parsed.hasAuthority ||
        parsed.hasQuery ||
        parsed.hasFragment ||
        parsed.pathSegments.any(
          (segment) => segment == '.' || segment == '..',
        )) {
      throw ArgumentError.value(
        relativePath,
        'relativePath',
        'Must be a safe path relative to /api/v1/.',
      );
    }
    final endpointSegments = Uri.parse(unversionedPath).pathSegments;
    return apiV1BaseUri.replace(
      pathSegments: [
        ...apiV1BaseUri.pathSegments.where((segment) => segment.isNotEmpty),
        ...endpointSegments,
      ],
    );
  }

  static int? _parseTimeout(String value) {
    final timeout = int.tryParse(value.trim());
    if (timeout == null ||
        timeout < minimumApiTimeoutSeconds ||
        timeout > maximumApiTimeoutSeconds) {
      return null;
    }
    return timeout;
  }

  static Uri? _parseApiBaseUri(String value, AppEnvironment environment) {
    final candidate = value.trim();
    final uri = Uri.tryParse(candidate);
    if (candidate.isEmpty ||
        uri == null ||
        !uri.isAbsolute ||
        uri.host.isEmpty ||
        _rawAuthorityContainsUserInfo(candidate) ||
        uri.userInfo.isNotEmpty ||
        uri.hasQuery ||
        uri.hasFragment ||
        (uri.scheme != 'https' && uri.scheme != 'http')) {
      return null;
    }

    final normalizedPath = uri.path.endsWith('/') && uri.path.length > 1
        ? uri.path.substring(0, uri.path.length - 1)
        : uri.path;
    if (normalizedPath.isNotEmpty &&
        normalizedPath != '/' &&
        normalizedPath != '/api/v1') {
      return null;
    }
    if (uri.scheme == 'http' &&
        (environment != AppEnvironment.development ||
            !_isDevelopmentHost(uri.host))) {
      return null;
    }

    return uri.replace(path: '/api/v1/', query: null, fragment: null);
  }

  static bool _rawAuthorityContainsUserInfo(String value) {
    final authorityStart = value.indexOf('://');
    if (authorityStart < 0) return false;
    final remainder = value.substring(authorityStart + 3);
    final authorityEnd = remainder.indexOf(RegExp(r'[/\?#]'));
    final authority = authorityEnd < 0
        ? remainder
        : remainder.substring(0, authorityEnd);
    return authority.contains('@');
  }

  static bool _isDevelopmentHost(String host) {
    final normalized = host.toLowerCase();
    if (normalized == 'localhost' ||
        normalized == '127.0.0.1' ||
        normalized == '::1' ||
        normalized == '10.0.2.2') {
      return true;
    }
    final parts = normalized.split('.');
    if (parts.length != 4) return false;
    final octets = parts.map(int.tryParse).toList(growable: false);
    if (octets.any((octet) => octet == null || octet < 0 || octet > 255)) {
      return false;
    }
    final first = octets[0]!;
    final second = octets[1]!;
    return first == 10 ||
        (first == 172 && second >= 16 && second <= 31) ||
        (first == 192 && second == 168);
  }
}
