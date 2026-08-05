// ignore_for_file: prefer_initializing_formals

import 'dart:math';

import 'package:flutter/foundation.dart';

import '../storage/secure_key_value_store.dart';

abstract interface class DeviceIdentity {
  Future<String> identifier();
  String get platform;
}

class SecureDeviceIdentity implements DeviceIdentity {
  SecureDeviceIdentity(
    this._storage, {
    Random? random,
    TargetPlatform? targetPlatform,
    bool? web,
  }) : _random = random ?? Random.secure(),
       _targetPlatform = targetPlatform,
       _web = web;

  static const storageKey = 'auth.device_id.v1';
  static final _uuidPattern = RegExp(
    r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
  );

  final SecureKeyValueStore _storage;
  final Random _random;
  final TargetPlatform? _targetPlatform;
  final bool? _web;
  String? _cachedIdentifier;

  @override
  Future<String> identifier() async {
    final cached = _cachedIdentifier;
    if (cached != null) return cached;
    final stored = await _storage.read(storageKey);
    if (stored != null && _uuidPattern.hasMatch(stored)) {
      return _cachedIdentifier = stored;
    }
    final generated = _uuidV4();
    await _storage.write(storageKey, generated);
    return _cachedIdentifier = generated;
  }

  @override
  String get platform {
    if (_web ?? kIsWeb) return 'web';
    return switch (_targetPlatform ?? defaultTargetPlatform) {
      TargetPlatform.android => 'android',
      TargetPlatform.iOS => 'ios',
      TargetPlatform.linux ||
      TargetPlatform.macOS ||
      TargetPlatform.windows ||
      TargetPlatform.fuchsia => 'desktop',
    };
  }

  String _uuidV4() {
    final bytes = List<int>.generate(16, (_) => _random.nextInt(256));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    final value = bytes
        .map((byte) => byte.toRadixString(16).padLeft(2, '0'))
        .join();
    return '${value.substring(0, 8)}-${value.substring(8, 12)}-'
        '${value.substring(12, 16)}-${value.substring(16, 20)}-'
        '${value.substring(20)}';
  }
}
