import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/features/authentication/data/repositories/mock_auth_repository.dart';
import 'package:saxlem_app/features/authentication/domain/entities/auth_session.dart';
import 'package:saxlem_app/features/authentication/domain/entities/phone_number.dart';
import 'package:saxlem_app/features/authentication/domain/repositories/auth_repository.dart';

class MemorySessionStorage implements SessionStorage {
  StoredSession? value;
  @override
  Future<void> clear() async => value = null;
  @override
  Future<StoredSession?> read() async => value;
  @override
  Future<void> write(StoredSession session) async => value = session;
}

void main() {
  test('verified OTP persists and restores an authenticated session', () async {
    final storage = MemorySessionStorage();
    final repository = MockAuthRepository(storage);
    final challenge = await repository.requestOtp(
      PhoneNumber.parseIraq('07501234567')!,
    );
    final session = await repository.verifyOtp(
      challengeId: challenge.id,
      code: '123456',
    );
    expect(session.status, AuthSessionStatus.authenticated);
    expect(
      (await repository.restoreSession()).status,
      AuthSessionStatus.authenticated,
    );
  });

  test('expired persisted session is cleared', () async {
    final storage = MemorySessionStorage()
      ..value = StoredSession(
        userId: 'patient',
        phoneNumber: '+9647501234567',
        expiresAt: DateTime(2025),
      );
    final repository = MockAuthRepository(storage, now: () => DateTime(2026));
    expect(
      (await repository.restoreSession()).status,
      AuthSessionStatus.sessionExpired,
    );
    expect(storage.value, isNull);
  });

  test('logout transitions storage back to guest', () async {
    final storage = MemorySessionStorage()
      ..value = StoredSession(
        userId: 'patient',
        phoneNumber: '+9647501234567',
        expiresAt: DateTime(2030),
      );
    final repository = MockAuthRepository(storage);
    await repository.logout();
    expect((await repository.restoreSession()).status, AuthSessionStatus.guest);
  });
}
