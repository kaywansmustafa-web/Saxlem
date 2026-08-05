import 'dart:convert';

import '../../../../core/storage/secure_key_value_store.dart';
import '../../domain/repositories/auth_repository.dart';

enum SessionStorageFailureReason { malformed, unsupportedVersion }

class SessionStorageException implements Exception {
  const SessionStorageException(this.reason);

  final SessionStorageFailureReason reason;

  @override
  String toString() => 'SessionStorageException(${reason.name})';
}

class SecureSessionStorage implements SessionStorage {
  const SecureSessionStorage(this._storage);

  final SecureKeyValueStore _storage;

  static const sessionKey = 'auth.session.v1';
  static const _legacyKeys = ['auth.user_id', 'auth.phone', 'auth.expires_at'];
  static final _uuidPattern = RegExp(
    r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
  );

  @override
  Future<StoredSession?> read() async {
    await _clearLegacyKeys();
    final encoded = await _storage.read(sessionKey);
    if (encoded == null) return null;
    try {
      final decoded = jsonDecode(encoded);
      if (decoded is! Map<String, dynamic>) throw const FormatException();
      if (decoded['version'] != 1) {
        throw const SessionStorageException(
          SessionStorageFailureReason.unsupportedVersion,
        );
      }
      final kind = _requiredString(decoded, 'kind');
      final phone = _requiredString(decoded, 'phoneNumber');
      final expiry = DateTime.tryParse(_requiredString(decoded, 'expiresAt'));
      if (expiry == null ||
          !expiry.isUtc ||
          !RegExp(r'^\+9647\d{9}$').hasMatch(phone)) {
        throw const FormatException();
      }
      final userId = _optionalString(decoded, 'userId');
      if (kind == 'mock') {
        _requireExactKeys(decoded, {
          'version',
          'kind',
          'userId',
          'phoneNumber',
          'expiresAt',
        });
        if (userId == null) throw const FormatException();
        return StoredSession(
          userId: userId,
          phoneNumber: phone,
          expiresAt: expiry,
        );
      }
      if (kind != 'backend') throw const FormatException();
      _requireExactKeys(decoded, {
        'version',
        'kind',
        'userId',
        'phoneNumber',
        'expiresAt',
        'accessToken',
        'refreshToken',
        'deviceId',
      });
      final accessToken = _requiredString(decoded, 'accessToken');
      final refreshToken = _requiredString(decoded, 'refreshToken');
      final deviceId = _requiredString(decoded, 'deviceId');
      if (accessToken.length < 32 ||
          accessToken.length > 8192 ||
          refreshToken.length < 32 ||
          refreshToken.length > 256 ||
          !_uuidPattern.hasMatch(deviceId)) {
        throw const FormatException();
      }
      return StoredSession(
        userId: userId,
        phoneNumber: phone,
        expiresAt: expiry,
        accessToken: accessToken,
        refreshToken: refreshToken,
        deviceId: deviceId,
      );
    } on SessionStorageException {
      rethrow;
    } catch (_) {
      throw const SessionStorageException(
        SessionStorageFailureReason.malformed,
      );
    }
  }

  @override
  Future<void> write(StoredSession session) async {
    final isBackend = session.isBackendSession;
    final hasBackendField =
        session.accessToken != null ||
        session.refreshToken != null ||
        session.deviceId != null;
    if (hasBackendField && !isBackend) {
      throw const SessionStorageException(
        SessionStorageFailureReason.malformed,
      );
    }
    if (!isBackend && session.userId == null) {
      throw const SessionStorageException(
        SessionStorageFailureReason.malformed,
      );
    }
    if (!RegExp(r'^\+9647\d{9}$').hasMatch(session.phoneNumber) ||
        (isBackend &&
            (session.accessToken!.length < 32 ||
                session.accessToken!.length > 8192 ||
                session.refreshToken!.length < 32 ||
                session.refreshToken!.length > 256 ||
                !_uuidPattern.hasMatch(session.deviceId!)))) {
      throw const SessionStorageException(
        SessionStorageFailureReason.malformed,
      );
    }
    final record = <String, Object?>{
      'version': 1,
      'kind': isBackend ? 'backend' : 'mock',
      'userId': session.userId,
      'phoneNumber': session.phoneNumber,
      'expiresAt': session.expiresAt.toUtc().toIso8601String(),
      if (isBackend) ...{
        'accessToken': session.accessToken,
        'refreshToken': session.refreshToken,
        'deviceId': session.deviceId,
      },
    };
    await _storage.write(sessionKey, jsonEncode(record));
    await _clearLegacyKeys();
  }

  @override
  Future<void> clear() async {
    await _storage.delete(sessionKey);
    await _clearLegacyKeys();
  }

  Future<void> _clearLegacyKeys() async {
    for (final key in _legacyKeys) {
      await _storage.delete(key);
    }
  }

  static String _requiredString(Map<String, dynamic> value, String key) {
    final field = value[key];
    if (field is! String || field.isEmpty) throw const FormatException();
    return field;
  }

  static String? _optionalString(Map<String, dynamic> value, String key) {
    final field = value[key];
    if (field == null) return null;
    if (field is! String || field.isEmpty) throw const FormatException();
    return field;
  }

  static void _requireExactKeys(
    Map<String, dynamic> value,
    Set<String> allowed,
  ) {
    if (value.keys.any((key) => !allowed.contains(key))) {
      throw const FormatException();
    }
  }
}
