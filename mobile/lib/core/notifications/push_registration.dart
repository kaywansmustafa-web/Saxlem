import 'dart:async';

/// The server side of push: which phones get this person's notifications.
abstract interface class PushDevicesSource {
  Future<void> registerPushDevice({
    required String token,
    required String platform,
    required String locale,
  });
  Future<void> removePushDevice(String token);
}

/// The phone side: permission and this app install's push address (the
/// Firebase Installation ID), which arrives on [registrations] after
/// [register] and again whenever it changes.
abstract interface class PushTokenProvider {
  /// Asks to show notifications; true when allowed.
  Future<bool> requestPermission();
  Stream<String> get registrations;
  Future<void> register();
  Future<void> unregister();
}

/// Keeps the server's record of this phone current: after sign-in, when the
/// token rotates and when the app language changes. Push is a convenience
/// (the inbox holds everything), so failures are swallowed and retried on
/// the next start.
class PushRegistration {
  PushRegistration({
    required this.provider,
    required this.devices,
    required this.platform,
  });
  final PushTokenProvider provider;
  final PushDevicesSource devices;

  /// "android" or "ios".
  final String platform;

  String? _token;
  String _locale = 'en';
  StreamSubscription<String>? _refreshes;
  bool _started = false;

  Future<void> start(String locale) async {
    _locale = locale;
    if (_started) return;
    _started = true;
    try {
      if (!await provider.requestPermission()) return;
      // Listen first: the address can arrive as soon as register() runs.
      _refreshes ??= provider.registrations.listen((token) {
        _token = token;
        unawaited(_register());
      });
      await provider.register();
    } catch (_) {
      // Firebase not reachable (no Google Play services, offline): no push.
    }
  }

  Future<void> setLocale(String locale) async {
    if (locale == _locale) return;
    _locale = locale;
    if (_started) await _register();
  }

  /// Sign-out: this phone stops getting the person's notifications.
  Future<void> stop() async {
    _started = false;
    await _refreshes?.cancel();
    _refreshes = null;
    final token = _token;
    _token = null;
    if (token == null) return;
    try {
      await devices.removePushDevice(token);
    } catch (_) {
      // The server also forgets the phone's token when the session ends.
    }
    try {
      await provider.unregister();
    } catch (_) {}
  }

  Future<void> _register() async {
    final token = _token;
    if (token == null || token.length < 20) return;
    try {
      await devices.registerPushDevice(
        token: token,
        platform: platform,
        locale: _locale,
      );
    } catch (_) {}
  }
}
