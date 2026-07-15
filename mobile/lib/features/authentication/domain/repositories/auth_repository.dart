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
}

abstract interface class SessionStorage {
  Future<StoredSession?> read();
  Future<void> write(StoredSession session);
  Future<void> clear();
}

class StoredSession {
  const StoredSession({
    required this.userId,
    required this.phoneNumber,
    required this.expiresAt,
  });
  final String userId;
  final String phoneNumber;
  final DateTime expiresAt;
}
