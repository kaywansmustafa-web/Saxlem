import '../entities/auth_session.dart';
import '../entities/otp_challenge.dart';
import '../entities/phone_number.dart';
import '../repositories/auth_repository.dart';

class RestoreAuthSession {
  const RestoreAuthSession(this.repository);
  final AuthRepository repository;
  Future<AuthSession> call() => repository.restoreSession();
}

class RequestOtp {
  const RequestOtp(this.repository);
  final AuthRepository repository;
  Future<OtpChallenge> call(PhoneNumber phone) => repository.requestOtp(phone);
}

class VerifyOtp {
  const VerifyOtp(this.repository);
  final AuthRepository repository;
  Future<AuthSession> call(String challengeId, String code) =>
      repository.verifyOtp(challengeId: challengeId, code: code);
}
