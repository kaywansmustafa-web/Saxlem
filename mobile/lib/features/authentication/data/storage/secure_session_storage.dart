import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../domain/repositories/auth_repository.dart';

class SecureSessionStorage implements SessionStorage {
  const SecureSessionStorage(this._storage);
  final FlutterSecureStorage _storage;

  static const _userId = 'auth.user_id';
  static const _phone = 'auth.phone';
  static const _expiresAt = 'auth.expires_at';

  @override
  Future<StoredSession?> read() async {
    final values = await _storage.readAll();
    final userId = values[_userId];
    final phone = values[_phone];
    final expiry = DateTime.tryParse(values[_expiresAt] ?? '');
    if (userId == null || phone == null || expiry == null) return null;
    return StoredSession(userId: userId, phoneNumber: phone, expiresAt: expiry);
  }

  @override
  Future<void> write(StoredSession session) async {
    await _storage.write(key: _userId, value: session.userId);
    await _storage.write(key: _phone, value: session.phoneNumber);
    await _storage.write(
      key: _expiresAt,
      value: session.expiresAt.toIso8601String(),
    );
  }

  @override
  Future<void> clear() async {
    await _storage.delete(key: _userId);
    await _storage.delete(key: _phone);
    await _storage.delete(key: _expiresAt);
  }
}
