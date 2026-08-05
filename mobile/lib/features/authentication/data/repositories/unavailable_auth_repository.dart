import '../../domain/entities/auth_session.dart';
import '../../domain/entities/otp_challenge.dart';
import '../../domain/entities/phone_number.dart';
import '../../domain/errors/auth_failure.dart';
import '../../domain/repositories/auth_repository.dart';

class UnavailableAuthRepository implements AuthRepository {
  const UnavailableAuthRepository();

  @override
  Future<AuthSession> restoreSession() async => const AuthSession.guest();

  @override
  Future<OtpChallenge> requestOtp(PhoneNumber phoneNumber) =>
      Future.error(const AuthFailure('unavailable'));

  @override
  Future<OtpChallenge> resendOtp(String challengeId) =>
      Future.error(const AuthFailure('unavailable'));

  @override
  Future<AuthSession> verifyOtp({
    required String challengeId,
    required String code,
  }) => Future.error(const AuthFailure('unavailable'));

  @override
  Future<void> continueAsGuest() async {}

  @override
  Future<void> logout() async {}

  @override
  Future<void> logoutAll() async {}
}
