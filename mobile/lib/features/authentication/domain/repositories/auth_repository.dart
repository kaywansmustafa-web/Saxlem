import '../entities/auth_session.dart';
import '../entities/otp_challenge.dart';
import '../entities/phone_number.dart';

abstract interface class AuthRepository {
  Future<AuthSession> restoreSession();
  Future<OtpChallenge> requestOtp(PhoneNumber phoneNumber);
  Future<AuthSession> verifyOtp({
    required String challengeId,
    required String code,
  });
  Future<OtpChallenge> resendOtp(String challengeId);
  Future<void> continueAsGuest();
  Future<void> logout();
  Future<void> logoutAll();
}

abstract interface class SessionStorage {
  Future<StoredSession?> read();
  Future<void> write(StoredSession session);
  Future<void> clear();
}

class StoredSession {
  const StoredSession({
    this.userId,
    required this.phoneNumber,
    required this.expiresAt,
    this.accessToken,
    this.refreshToken,
    this.deviceId,
  });
  final String? userId;
  final String phoneNumber;
  final DateTime expiresAt;
  final String? accessToken;
  final String? refreshToken;
  final String? deviceId;

  bool get isBackendSession =>
      accessToken != null && refreshToken != null && deviceId != null;
}
