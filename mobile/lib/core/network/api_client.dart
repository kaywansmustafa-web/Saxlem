// ignore_for_file: prefer_initializing_formals

import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:http/http.dart' as http;

import '../../config/environment/app_configuration.dart';
import 'api_failure.dart';

class ApiResponse {
  const ApiResponse({required this.body, this.requestId});

  final Map<String, dynamic> body;
  final String? requestId;
}

class ApiListResponse {
  const ApiListResponse({required this.body, this.requestId});
  final List<Object?> body;
  final String? requestId;
}

class ApiClient {
  ApiClient({
    required AppConfiguration configuration,
    required http.Client client,
  }) : _configuration = configuration,
       _client = client;

  final AppConfiguration _configuration;
  final http.Client _client;
  static const int maximumResponseBytes = 1024 * 1024;

  Future<ApiResponse> postJson(
    String path, {
    required Map<String, Object?> body,
    String? bearerToken,
  }) => _send('POST', path, body: body, bearerToken: bearerToken);

  Future<ApiResponse> getJson(String path, {String? bearerToken}) =>
      _send('GET', path, bearerToken: bearerToken);

  Future<ApiListResponse> getJsonList(
    String path, {
    String? bearerToken,
  }) async {
    final request = http.Request('GET', _configuration.apiEndpoint(path));
    request.followRedirects = false;
    request.maxRedirects = 0;
    request.headers['accept'] = 'application/json';
    if (bearerToken != null) {
      request.headers['authorization'] = 'Bearer $bearerToken';
    }
    try {
      final response = await _performRaw(
        request,
      ).timeout(_configuration.apiTimeout);
      final requestId = _safeRequestId(response.headers['x-request-id']);
      final Object? decoded;
      try {
        decoded = jsonDecode(
          utf8.decode(response.bodyBytes, allowMalformed: false),
        );
      } catch (_) {
        throw ApiFailure(
          type: ApiFailureType.malformedResponse,
          statusCode: response.statusCode,
          requestId: requestId,
        );
      }
      if (response.statusCode >= 200 &&
          response.statusCode < 300 &&
          decoded is List<Object?>) {
        return ApiListResponse(body: decoded, requestId: requestId);
      }
      if (decoded is Map<String, dynamic> &&
          (response.statusCode < 200 || response.statusCode >= 300)) {
        throw _error(response.statusCode, decoded, requestId);
      }
      throw ApiFailure(
        type: ApiFailureType.malformedResponse,
        statusCode: response.statusCode,
        requestId: requestId,
      );
    } on TimeoutException {
      throw const ApiFailure(type: ApiFailureType.timeout, retryable: true);
    } on http.ClientException {
      throw const ApiFailure(type: ApiFailureType.offline, retryable: true);
    } on ApiFailure {
      rethrow;
    } catch (_) {
      throw const ApiFailure(type: ApiFailureType.offline, retryable: true);
    }
  }

  Future<ApiResponse> _send(
    String method,
    String path, {
    Map<String, Object?>? body,
    String? bearerToken,
  }) async {
    final request = http.Request(method, _configuration.apiEndpoint(path));
    request.followRedirects = false;
    request.maxRedirects = 0;
    request.headers['accept'] = 'application/json';
    if (body != null) {
      request.headers['content-type'] = 'application/json';
      request.body = jsonEncode(body);
    }
    if (bearerToken != null) {
      request.headers['authorization'] = 'Bearer $bearerToken';
    }
    try {
      return await _perform(request).timeout(_configuration.apiTimeout);
    } on TimeoutException {
      throw const ApiFailure(type: ApiFailureType.timeout, retryable: true);
    } on http.ClientException {
      throw const ApiFailure(type: ApiFailureType.offline, retryable: true);
    } on ApiFailure {
      rethrow;
    } catch (_) {
      throw const ApiFailure(type: ApiFailureType.offline, retryable: true);
    }
  }

  Future<ApiResponse> _perform(http.Request request) async {
    return _decode(await _performRaw(request));
  }

  Future<http.Response> _performRaw(http.Request request) async {
    final streamed = await _client.send(request);
    final bytes = BytesBuilder(copy: false);
    await for (final chunk in streamed.stream) {
      if (bytes.length + chunk.length > maximumResponseBytes) {
        throw ApiFailure(
          type: ApiFailureType.malformedResponse,
          statusCode: streamed.statusCode,
          requestId: _safeRequestId(streamed.headers['x-request-id']),
        );
      }
      bytes.add(chunk);
    }
    return http.Response.bytes(
      bytes.takeBytes(),
      streamed.statusCode,
      headers: streamed.headers,
      request: request,
    );
  }

  ApiResponse _decode(http.Response response) {
    final requestId = _safeRequestId(response.headers['x-request-id']);
    if (response.statusCode == 204) {
      if (response.bodyBytes.isNotEmpty) {
        throw ApiFailure(
          type: ApiFailureType.malformedResponse,
          statusCode: response.statusCode,
          requestId: requestId,
        );
      }
      return ApiResponse(body: const {}, requestId: requestId);
    }

    final Object? decoded;
    try {
      decoded = jsonDecode(
        utf8.decode(response.bodyBytes, allowMalformed: false),
      );
    } catch (_) {
      throw ApiFailure(
        type: ApiFailureType.malformedResponse,
        statusCode: response.statusCode,
        requestId: requestId,
      );
    }
    if (decoded is! Map<String, dynamic>) {
      throw ApiFailure(
        type: ApiFailureType.malformedResponse,
        statusCode: response.statusCode,
        requestId: requestId,
      );
    }
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return ApiResponse(body: decoded, requestId: requestId);
    }
    throw _error(response.statusCode, decoded, requestId);
  }

  ApiFailure _error(
    int status,
    Map<String, dynamic> body,
    String? headerRequestId,
  ) {
    final error = body['error'];
    if (error is! Map<String, dynamic> ||
        error['code'] is! String ||
        error['message'] is! String ||
        error['requestId'] is! String ||
        error['retryable'] is! bool ||
        error['fieldErrors'] is! List ||
        !(error['fieldErrors'] as List<Object?>).every(_isFieldError)) {
      return ApiFailure(
        type: ApiFailureType.malformedResponse,
        statusCode: status,
        requestId: headerRequestId,
      );
    }
    final envelopeRequestId = _safeRequestId(error['requestId'] as String);
    return ApiFailure(
      type: _statusType(status),
      statusCode: status,
      backendCode: _bounded(error['code'] as String, 128),
      requestId: headerRequestId ?? envelopeRequestId,
      retryable: error['retryable'] as bool,
    );
  }

  static ApiFailureType _statusType(int status) => switch (status) {
    400 => ApiFailureType.validation,
    401 => ApiFailureType.unauthenticated,
    403 => ApiFailureType.forbidden,
    404 => ApiFailureType.notFound,
    409 => ApiFailureType.conflict,
    429 => ApiFailureType.rateLimited,
    500 => ApiFailureType.server,
    503 => ApiFailureType.unavailable,
    _ => ApiFailureType.unexpectedStatus,
  };

  static String? _safeRequestId(String? value) {
    if (value == null) return null;
    final trimmed = value.trim();
    if (trimmed.isEmpty || trimmed.length > 128) return null;
    if (trimmed.codeUnits.any((unit) => unit < 0x20 || unit == 0x7f)) {
      return null;
    }
    return trimmed;
  }

  static String? _bounded(String value, int maximumLength) {
    final trimmed = value.trim();
    if (trimmed.isEmpty ||
        trimmed.codeUnits.any((unit) => unit < 0x20 || unit == 0x7f)) {
      return null;
    }
    return trimmed.length <= maximumLength
        ? trimmed
        : trimmed.substring(0, maximumLength);
  }

  static bool _isFieldError(Object? value) =>
      value is Map<String, dynamic> &&
      value['field'] is String &&
      value['code'] is String &&
      value['message'] is String;
}
