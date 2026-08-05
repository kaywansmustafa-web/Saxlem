enum ApiFailureType {
  validation,
  unauthenticated,
  forbidden,
  notFound,
  conflict,
  rateLimited,
  server,
  unavailable,
  timeout,
  offline,
  malformedResponse,
  unexpectedStatus,
}

class ApiFailure implements Exception {
  const ApiFailure({
    required this.type,
    this.statusCode,
    this.backendCode,
    this.requestId,
    this.retryable = false,
  });

  final ApiFailureType type;
  final int? statusCode;
  final String? backendCode;
  final String? requestId;
  final bool retryable;

  bool get isTemporary =>
      type == ApiFailureType.timeout ||
      type == ApiFailureType.offline ||
      type == ApiFailureType.unavailable ||
      type == ApiFailureType.rateLimited ||
      retryable ||
      (statusCode != null && statusCode! >= 500);

  @override
  String toString() =>
      'ApiFailure(type: ${type.name}, statusCode: $statusCode, '
      'backendCode: $backendCode, requestId: $requestId)';
}
