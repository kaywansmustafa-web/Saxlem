import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import 'push_registration.dart';

/// A tapped push: which notification, for which visit.
class PushTap {
  const PushTap({required this.type, this.appointmentId});
  final String type;
  final String? appointmentId;

  static PushTap? fromData(Map<String, dynamic> data) {
    final type = data['type'];
    if (type is! String || type.isEmpty || type.length > 100) return null;
    final appointment = data['appointmentId'];
    return PushTap(
      type: type,
      appointmentId:
          appointment is String &&
              RegExp(r'^[0-9a-fA-F-]{36}$').hasMatch(appointment)
          ? appointment
          : null,
    );
  }
}

/// Firebase settings, given at build time so no google-services files are
/// needed:
///   --dart-define=FIREBASE_PROJECT_ID=… --dart-define=FIREBASE_SENDER_ID=…
///   --dart-define=FIREBASE_ANDROID_API_KEY=… --dart-define=FIREBASE_ANDROID_APP_ID=…
///   --dart-define=FIREBASE_IOS_API_KEY=… --dart-define=FIREBASE_IOS_APP_ID=…
/// Missing values mean no push on that platform.
abstract final class PushOptions {
  static const _project = String.fromEnvironment('FIREBASE_PROJECT_ID');
  static const _sender = String.fromEnvironment('FIREBASE_SENDER_ID');
  static const _androidKey = String.fromEnvironment('FIREBASE_ANDROID_API_KEY');
  static const _androidApp = String.fromEnvironment('FIREBASE_ANDROID_APP_ID');
  static const _iosKey = String.fromEnvironment('FIREBASE_IOS_API_KEY');
  static const _iosApp = String.fromEnvironment('FIREBASE_IOS_APP_ID');
  static const _iosBundle = String.fromEnvironment(
    'FIREBASE_IOS_BUNDLE_ID',
    defaultValue: 'com.saxlem.saxlemApp',
  );

  static FirebaseOptions? forPlatform(TargetPlatform platform) {
    if (_project.isEmpty || _sender.isEmpty) return null;
    return switch (platform) {
      TargetPlatform.android
          when _androidKey.isNotEmpty && _androidApp.isNotEmpty =>
        const FirebaseOptions(
          apiKey: _androidKey,
          appId: _androidApp,
          messagingSenderId: _sender,
          projectId: _project,
        ),
      TargetPlatform.iOS when _iosKey.isNotEmpty && _iosApp.isNotEmpty =>
        const FirebaseOptions(
          apiKey: _iosKey,
          appId: _iosApp,
          messagingSenderId: _sender,
          projectId: _project,
          iosBundleId: _iosBundle,
        ),
      _ => null,
    };
  }
}

/// Push for the signed-in patient. [instance] does nothing until [setUp]
/// finds Firebase settings, so tests and unconfigured builds just skip push.
class PushMessaging {
  PushMessaging._(this._provider, this._platform);
  static PushMessaging instance = PushMessaging._(null, '');

  /// Android channel the server names in every push.
  static const channelId = 'saxlem_updates';

  final _FirebaseTokens? _provider;
  final String _platform;
  PushRegistration? _registration;
  final _taps = StreamController<PushTap>.broadcast();
  bool _listening = false;

  bool get enabled => _provider != null;

  /// Taps on a push while the app was in the background.
  Stream<PushTap> get taps => _taps.stream;

  /// Call once in main() before runApp.
  static Future<void> setUp() async {
    final platform = defaultTargetPlatform;
    final options = PushOptions.forPlatform(platform);
    if (kIsWeb || options == null) return;
    try {
      await Firebase.initializeApp(options: options);
      instance = PushMessaging._(
        _FirebaseTokens(),
        platform == TargetPlatform.iOS ? 'ios' : 'android',
      );
    } catch (_) {
      // Bad settings or no Play services: the app works without push.
    }
  }

  /// After sign-in, with the app's language and the channel's visible name.
  Future<void> start({
    required PushDevicesSource devices,
    required String locale,
    required String channelName,
  }) async {
    final provider = _provider;
    if (provider == null) return;
    if (!_listening) {
      _listening = true;
      FirebaseMessaging.onMessageOpenedApp.listen((message) {
        final tap = PushTap.fromData(message.data);
        if (tap != null) _taps.add(tap);
      });
    }
    if (_platform == 'android') {
      try {
        await FlutterLocalNotificationsPlugin()
            .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin
            >()
            ?.createNotificationChannel(
              AndroidNotificationChannel(
                channelId,
                channelName,
                importance: Importance.high,
              ),
            );
      } catch (_) {}
    }
    _registration ??= PushRegistration(
      provider: provider,
      devices: devices,
      platform: _platform,
    );
    await _registration!.start(locale);
  }

  /// The push that opened the app from closed, once.
  Future<PushTap?> initialTap() async {
    if (_provider == null) return null;
    try {
      final message = await FirebaseMessaging.instance.getInitialMessage();
      return message == null ? null : PushTap.fromData(message.data);
    } catch (_) {
      return null;
    }
  }

  Future<void> setLocale(String locale) async =>
      _registration?.setLocale(locale);

  Future<void> stop() async {
    await _registration?.stop();
    _registration = null;
  }
}

class _FirebaseTokens implements PushTokenProvider {
  FirebaseMessaging get _messaging => FirebaseMessaging.instance;

  @override
  Future<bool> requestPermission() async {
    final settings = await _messaging.requestPermission();
    return settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional;
  }

  @override
  Stream<String> get registrations => _messaging.onRegistered;

  @override
  Future<void> register() => _messaging.register();

  @override
  Future<void> unregister() => _messaging.unregister();
}
