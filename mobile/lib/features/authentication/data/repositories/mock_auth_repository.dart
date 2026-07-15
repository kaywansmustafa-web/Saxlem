import '../../domain/entities/auth_session.dart';
import '../../domain/entities/otp_challenge.dart';
import '../../domain/entities/phone_number.dart';
import '../../domain/errors/auth_failure.dart';
import '../../domain/repositories/auth_repository.dart';

class MockAuthRepository implements AuthRepository {
  MockAuthRepository(this._storage, {DateTime Function()? now})
    : _now = now ?? DateTime.now;

  final SessionStorage _storage;
  final DateTime Function() _now;
  PhoneNumber? _phone;
  OtpChallenge? _challenge;
  int _attempts = 0;

  static const developmentOtp = '123456';

  @override
  Future<AuthSession> restoreSession() async {
    final stored = await _storage.read();
    if (stored == null) return const AuthSession.guest();
    if (!stored.expiresAt.isAfter(_now())) {
      await _storage.clear();
      return const AuthSession.sessionExpired();
    }
    return AuthSession.authenticated(
      userId: stored.userId,
      phoneNumber: stored.phoneNumber,
    );
  }

  @override
  Future<OtpChallenge> requestOtp(PhoneNumber phoneNumber) async {
    _phone = phoneNumber;
    _attempts = 0;
    final now = _now();
    return _challenge = OtpChallenge(
      id: 'mock-${now.microsecondsSinceEpoch}',
      maskedDestination: phoneNumber.masked,
      expiresAt: now.add(const Duration(minutes: 5)),
      resendAvailableAt: now.add(const Duration(seconds: 30)),
    );
  }

  @override
  Future<OtpChallenge> resendOtp(String challengeId) async {
    final current = _challenge;
    if (current == null || current.id != challengeId) {
      throw const AuthFailure('challenge');
    }
    if (_now().isBefore(current.resendAvailableAt)) {
      throw const AuthFailure('resend');
    }
    return requestOtp(_phone!);
  }

  @override
  Future<AuthSession> verifyOtp({
    required String challengeId,
    required String code,
  }) async {
    final challenge = _challenge;
    if (challenge == null ||
        challenge.id != challengeId ||
        !_now().isBefore(challenge.expiresAt)) {
      throw const AuthFailure('expired');
    }
    if (++_attempts > 5) throw const AuthFailure('limited');
    // Development-only deterministic code. A backend replaces this repository.
    if (code != developmentOtp) throw const AuthFailure('invalid');
    final phone = _phone!;
    final stored = StoredSession(
      userId: 'mock-patient',
      phoneNumber: phone.e164,
      expiresAt: _now().add(const Duration(days: 7)),
    );
    await _storage.write(stored);
    _challenge = null;
    return AuthSession.authenticated(
      userId: stored.userId,
      phoneNumber: stored.phoneNumber,
    );
  }

  @override
  Future<void> continueAsGuest() async => _storage.clear();

  @override
  Future<void> logout() => _storage.clear();
}
