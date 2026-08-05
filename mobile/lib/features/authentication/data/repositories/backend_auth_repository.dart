// ignore_for_file: prefer_initializing_formals

import '../../../../config/environment/app_environment.dart';
import '../../../../core/device/device_identity.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_failure.dart';
import '../../../../core/network/refresh_coordinator.dart';
import '../../domain/entities/auth_session.dart';
import '../../domain/entities/otp_challenge.dart';
import '../../domain/entities/phone_number.dart';
import '../../domain/errors/auth_failure.dart';
import '../../domain/repositories/auth_repository.dart';
import '../storage/secure_session_storage.dart';

class BackendAuthRepository implements AuthRepository {
  BackendAuthRepository({
    required ApiClient api,
    required SessionStorage storage,
    required DeviceIdentity deviceIdentity,
    required AppEnvironment environment,
    RefreshCoordinator<StoredSession>? refreshCoordinator,
    DateTime Function()? now,
  }) : _api = api,
       _storage = storage,
       _deviceIdentity = deviceIdentity,
       _environment = environment,
       _refreshCoordinator = refreshCoordinator ?? RefreshCoordinator(),
       _now = now ?? DateTime.now;

  final ApiClient _api;
  final SessionStorage _storage;
  final DeviceIdentity _deviceIdentity;
  final AppEnvironment _environment;
  final RefreshCoordinator<StoredSession> _refreshCoordinator;
  final DateTime Function() _now;
  PhoneNumber? _pendingPhone;

  @override
  Future<AuthSession> restoreSession() async {
    final StoredSession? stored;
    try {
      stored = await _storage.read();
    } on SessionStorageException {
      await _storage.clear();
      return const AuthSession.malformedLocalSession();
    }
    if (stored == null) return const AuthSession.guest();
    if (!stored.isBackendSession) {
      await _storage.clear();
      return const AuthSession.malformedLocalSession();
    }
    final String currentDeviceId;
    try {
      currentDeviceId = await _deviceIdentity.identifier();
    } catch (_) {
      return const AuthSession.restorationUnavailable();
    }
    if (stored.deviceId != currentDeviceId) {
      await _clearLocalSession();
      return const AuthSession.sessionExpired();
    }
    if (stored.expiresAt.isAfter(_now().toUtc())) {
      return _authSession(stored);
    }
    try {
      return _authSession(
        await _refreshCoordinator.run(() => _refresh(stored!)),
      );
    } on ApiFailure catch (failure) {
      if (failure.isTemporary) {
        return const AuthSession.restorationUnavailable();
      }
      await _storage.clear();
      return const AuthSession.sessionExpired();
    } on AuthFailure {
      await _storage.clear();
      return const AuthSession.sessionExpired();
    }
  }

  @override
  Future<OtpChallenge> requestOtp(PhoneNumber phoneNumber) async {
    try {
      final response = await _api.postJson(
        'auth/request-otp',
        body: {'phone': phoneNumber.e164},
      );
      final challenge = _challenge(response.body, phoneNumber);
      _pendingPhone = phoneNumber;
      return challenge;
    } on ApiFailure catch (failure) {
      throw _authFailure(failure, fallback: 'request');
    }
  }

  @override
  Future<OtpChallenge> resendOtp(String challengeId) async {
    final phone = _pendingPhone;
    if (phone == null || challengeId.isEmpty) {
      throw const AuthFailure('challenge');
    }
    return requestOtp(phone);
  }

  @override
  Future<AuthSession> verifyOtp({
    required String challengeId,
    required String code,
  }) async {
    final phone = _pendingPhone;
    if (phone == null) throw const AuthFailure('challenge');
    try {
      final deviceId = await _deviceIdentity.identifier();
      final response = await _api.postJson(
        'auth/verify-otp',
        body: {
          'challengeId': challengeId,
          'otp': code,
          'deviceId': deviceId,
          'platform': _deviceIdentity.platform,
        },
      );
      final session = _session(
        response.body,
        phoneNumber: phone.e164,
        deviceId: deviceId,
      );
      try {
        await _storage.write(session);
      } catch (_) {
        await _clearLocalSession();
        throw const AuthFailure('storage');
      }
      _pendingPhone = null;
      return _authSession(session);
    } on ApiFailure catch (failure) {
      throw _authFailure(failure, fallback: 'verify');
    } on AuthFailure {
      rethrow;
    } catch (_) {
      throw const AuthFailure('storage');
    }
  }

  Future<StoredSession> refreshSession() async {
    final session = await _storage.read();
    if (session == null || !session.isBackendSession) {
      throw const AuthFailure('expired');
    }
    return _refreshCoordinator.run(() => _refresh(session));
  }

  Future<StoredSession> _refresh(StoredSession current) async {
    final String deviceId;
    try {
      deviceId = await _deviceIdentity.identifier();
    } catch (_) {
      throw const ApiFailure(type: ApiFailureType.unavailable, retryable: true);
    }
    if (deviceId != current.deviceId) {
      await _storage.clear();
      throw const AuthFailure('expired');
    }
    try {
      final response = await _api.postJson(
        'auth/refresh',
        body: {
          'refreshToken': current.refreshToken,
          'deviceId': deviceId,
          'platform': _deviceIdentity.platform,
        },
      );
      final replacement = _session(
        response.body,
        phoneNumber: current.phoneNumber,
        deviceId: deviceId,
        userId: current.userId,
      );
      try {
        await _storage.write(replacement);
      } catch (_) {
        await _clearLocalSession();
        throw const AuthFailure('storage');
      }
      return replacement;
    } on ApiFailure catch (failure) {
      if (!failure.isTemporary) await _storage.clear();
      rethrow;
    } on AuthFailure {
      rethrow;
    }
  }

  @override
  Future<void> continueAsGuest() => _storage.clear();

  @override
  Future<void> logout() => _revoke('auth/logout');

  @override
  Future<void> logoutAll() => _revoke('auth/logout-all');

  Future<void> _revoke(String path) async {
    try {
      final session = await _storage.read();
      if (session?.refreshToken != null) {
        await _api.postJson(
          path,
          body: {'refreshToken': session!.refreshToken},
        );
      }
    } catch (_) {
      // Local logout is authoritative for this device even when revocation fails.
    } finally {
      await _storage.clear();
    }
  }

  Future<void> _clearLocalSession() async {
    try {
      await _storage.clear();
    } catch (_) {
      // The original safe error is retained without exposing storage details.
    }
  }

  OtpChallenge _challenge(Map<String, dynamic> body, PhoneNumber phoneNumber) {
    final id = _string(body, 'challengeId', maximumLength: 64);
    final expiresAt = _dateTime(body, 'expiresAt');
    if (!_uuidPattern.hasMatch(id) || !expiresAt.isAfter(_now().toUtc())) {
      throw const ApiFailure(type: ApiFailureType.malformedResponse);
    }
    final developmentOtp = body['developmentOtp'];
    if (developmentOtp != null &&
        (developmentOtp is! String ||
            !RegExp(r'^\d{6}$').hasMatch(developmentOtp) ||
            _environment != AppEnvironment.development)) {
      throw const ApiFailure(type: ApiFailureType.malformedResponse);
    }
    return OtpChallenge(
      id: id,
      maskedDestination: phoneNumber.masked,
      expiresAt: expiresAt,
      resendAvailableAt: _now().add(const Duration(seconds: 30)),
      developmentOtp: _environment == AppEnvironment.development
          ? developmentOtp as String?
          : null,
    );
  }

  StoredSession _session(
    Map<String, dynamic> body, {
    required String phoneNumber,
    required String deviceId,
    String? userId,
  }) {
    final accessToken = _string(body, 'accessToken', maximumLength: 8192);
    final refreshToken = _string(body, 'refreshToken', maximumLength: 256);
    final expires = body['expiresInSeconds'];
    if (accessToken.length < 32 ||
        refreshToken.length < 32 ||
        expires is! int ||
        expires < 1 ||
        expires > 86400) {
      throw const ApiFailure(type: ApiFailureType.malformedResponse);
    }
    return StoredSession(
      userId: userId,
      phoneNumber: phoneNumber,
      expiresAt: _now().toUtc().add(Duration(seconds: expires)),
      accessToken: accessToken,
      refreshToken: refreshToken,
      deviceId: deviceId,
    );
  }

  static String _string(
    Map<String, dynamic> body,
    String key, {
    required int maximumLength,
  }) {
    final value = body[key];
    if (value is! String || value.isEmpty || value.length > maximumLength) {
      throw const ApiFailure(type: ApiFailureType.malformedResponse);
    }
    return value;
  }

  static DateTime _dateTime(Map<String, dynamic> body, String key) {
    final value = body[key];
    final parsed = value is String ? DateTime.tryParse(value) : null;
    if (parsed == null || !parsed.isUtc) {
      throw const ApiFailure(type: ApiFailureType.malformedResponse);
    }
    return parsed;
  }

  static final _uuidPattern = RegExp(
    r'^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
  );

  static AuthFailure _authFailure(
    ApiFailure failure, {
    required String fallback,
  }) => AuthFailure(switch (failure.type) {
    ApiFailureType.validation => 'invalid',
    ApiFailureType.unauthenticated => 'invalid',
    ApiFailureType.forbidden => 'forbidden',
    ApiFailureType.rateLimited => 'limited',
    ApiFailureType.timeout ||
    ApiFailureType.offline ||
    ApiFailureType.server ||
    ApiFailureType.unavailable => 'unavailable',
    ApiFailureType.malformedResponse => 'response',
    _ => fallback,
  });

  static AuthSession _authSession(StoredSession session) =>
      AuthSession.authenticated(
        userId: session.userId,
        phoneNumber: session.phoneNumber,
      );
}
