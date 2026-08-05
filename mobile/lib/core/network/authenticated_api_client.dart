// ignore_for_file: prefer_initializing_formals

import '../../features/authentication/domain/repositories/auth_repository.dart';
import 'api_client.dart';
import 'api_failure.dart';

class AuthenticatedApiClient {
  AuthenticatedApiClient({
    required ApiClient api,
    required SessionStorage storage,
    required Future<StoredSession> Function() refresh,
  }) : _api = api,
       _storage = storage,
       _refresh = refresh;

  final ApiClient _api;
  final SessionStorage _storage;
  final Future<StoredSession> Function() _refresh;

  Future<ApiResponse> getJson(
    String path, {
    Map<String, String>? queryParameters,
  }) async {
    final session = await _requiredSession();
    try {
      return await _api.getJson(
        path,
        bearerToken: session.accessToken,
        queryParameters: queryParameters,
      );
    } on ApiFailure catch (failure) {
      if (failure.type != ApiFailureType.unauthenticated) rethrow;
      final refreshed = await _refresh();
      try {
        return await _api.getJson(
          path,
          bearerToken: refreshed.accessToken,
          queryParameters: queryParameters,
        );
      } on ApiFailure catch (retryFailure) {
        if (retryFailure.type == ApiFailureType.unauthenticated) {
          await _storage.clear();
        }
        rethrow;
      }
    }
  }

  Future<ApiListResponse> getJsonList(String path) async {
    final session = await _requiredSession();
    try {
      return await _api.getJsonList(path, bearerToken: session.accessToken);
    } on ApiFailure catch (failure) {
      if (failure.type != ApiFailureType.unauthenticated) rethrow;
      final refreshed = await _refresh();
      try {
        return await _api.getJsonList(path, bearerToken: refreshed.accessToken);
      } on ApiFailure catch (retryFailure) {
        if (retryFailure.type == ApiFailureType.unauthenticated) {
          await _storage.clear();
        }
        rethrow;
      }
    }
  }

  Future<ApiResponse> postJson(
    String path, {
    required Map<String, Object?> body,
  }) async {
    final session = await _requiredSession();
    return _api.postJson(path, body: body, bearerToken: session.accessToken);
  }

  Future<StoredSession> _requiredSession() async {
    final session = await _storage.read();
    if (session == null || !session.isBackendSession) {
      throw const ApiFailure(type: ApiFailureType.unauthenticated);
    }
    return session;
  }
}
