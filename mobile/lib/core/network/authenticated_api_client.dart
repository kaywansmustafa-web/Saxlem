// ignore_for_file: prefer_initializing_formals

import '../../features/authentication/domain/repositories/auth_repository.dart';
import 'api_client.dart';
import 'api_failure.dart';
import 'refresh_coordinator.dart';

class AuthenticatedApiClient {
  AuthenticatedApiClient({
    required ApiClient api,
    required SessionStorage storage,
    required RefreshCoordinator<StoredSession> refreshCoordinator,
    required Future<StoredSession> Function() refresh,
  }) : _api = api,
       _storage = storage,
       _refreshCoordinator = refreshCoordinator,
       _refresh = refresh;

  final ApiClient _api;
  final SessionStorage _storage;
  final RefreshCoordinator<StoredSession> _refreshCoordinator;
  final Future<StoredSession> Function() _refresh;

  Future<ApiResponse> getJson(String path) async {
    final session = await _requiredSession();
    try {
      return await _api.getJson(path, bearerToken: session.accessToken);
    } on ApiFailure catch (failure) {
      if (failure.type != ApiFailureType.unauthenticated) rethrow;
      final refreshed = await _refreshCoordinator.run(_refresh);
      return _api.getJson(path, bearerToken: refreshed.accessToken);
    }
  }

  Future<StoredSession> _requiredSession() async {
    final session = await _storage.read();
    if (session == null || !session.isBackendSession) {
      throw const ApiFailure(type: ApiFailureType.unauthenticated);
    }
    return session;
  }
}
