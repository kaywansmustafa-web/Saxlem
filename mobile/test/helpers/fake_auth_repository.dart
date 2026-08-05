import 'package:saxlem_app/features/authentication/domain/entities/auth_session.dart';
import 'package:saxlem_app/features/authentication/domain/entities/otp_challenge.dart';
import 'package:saxlem_app/features/authentication/domain/entities/phone_number.dart';
import 'package:saxlem_app/features/authentication/domain/repositories/auth_repository.dart';

class FakeAuthRepository implements AuthRepository {
  FakeAuthRepository({this.session = const AuthSession.guest()});
  AuthSession session;
  PhoneNumber? requestedPhone;

  @override
  Future<AuthSession> restoreSession() async => session;
  @override
  Future<void> continueAsGuest() async => session = const AuthSession.guest();
  @override
  Future<void> logout() async => session = const AuthSession.guest();
  @override
  Future<void> logoutAll() async => session = const AuthSession.guest();
  @override
  Future<OtpChallenge> requestOtp(PhoneNumber phoneNumber) async {
    requestedPhone = phoneNumber;
    final now = DateTime.now();
    return OtpChallenge(
      id: 'test',
      maskedDestination: phoneNumber.masked,
      expiresAt: now.add(const Duration(minutes: 5)),
      resendAvailableAt: now,
    );
  }

  @override
  Future<OtpChallenge> resendOtp(String challengeId) =>
      requestOtp(requestedPhone!);
  @override
  Future<AuthSession> verifyOtp({
    required String challengeId,
    required String code,
  }) async {
    return session = const AuthSession.authenticated(
      userId: 'patient',
      phoneNumber: '+9647501234567',
    );
  }
}
