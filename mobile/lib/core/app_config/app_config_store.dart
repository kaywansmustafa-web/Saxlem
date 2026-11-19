// ignore_for_file: prefer_initializing_formals

import 'dart:convert';

import 'package:flutter/widgets.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../network/api_client.dart';
import 'app_config.dart';

/// Where the config comes from.
abstract interface class AppConfigRepository {
  Future<AppConfig> fetch();
}

/// GET /app/config (public, no sign-in).
class BackendAppConfigRepository implements AppConfigRepository {
  const BackendAppConfigRepository(this._api);
  final ApiClient _api;

  @override
  Future<AppConfig> fetch() async =>
      const AppConfigParser().parse((await _api.getJson('app/config')).body);
}

/// No server (tests, demo builds): the built-in values.
class BuiltInAppConfigRepository implements AppConfigRepository {
  const BuiltInAppConfigRepository([this.config = AppConfig.builtIn]);
  final AppConfig config;
  @override
  Future<AppConfig> fetch() async => config;
}

/// The phone keeps the last good config, so Home has its tiles at once on
/// the next start, even offline.
abstract interface class AppConfigCache {
  Future<AppConfig?> read();
  Future<void> write(AppConfig config);
}

class SharedPreferencesAppConfigCache implements AppConfigCache {
  const SharedPreferencesAppConfigCache();
  static const _key = 'saxlem.appConfig';

  @override
  Future<AppConfig?> read() async {
    try {
      final text = (await SharedPreferences.getInstance()).getString(_key);
      if (text == null || text.length > 512 * 1024) return null;
      return const AppConfigParser().parse(jsonDecode(text));
    } catch (_) {
      return null;
    }
  }

  @override
  Future<void> write(AppConfig config) async {
    try {
      await (await SharedPreferences.getInstance()).setString(
        _key,
        encodeAppConfig(config),
      );
    } catch (_) {
      // Only a convenience.
    }
  }
}

class MemoryAppConfigCache implements AppConfigCache {
  AppConfig? value;
  @override
  Future<AppConfig?> read() async => value;
  @override
  Future<void> write(AppConfig config) async => value = config;
}

/// Holds the current config; refreshes at start and when the app returns
/// to the foreground (at most every 5 minutes).
class AppConfigController extends ChangeNotifier {
  AppConfigController({
    required AppConfigRepository repository,
    AppConfigCache? cache,
    DateTime Function()? now,
  }) : _repository = repository,
       _cache = cache ?? MemoryAppConfigCache(),
       _now = now ?? DateTime.now;

  final AppConfigRepository _repository;
  final AppConfigCache _cache;
  final DateTime Function() _now;
  AppConfig _config = AppConfig.builtIn;
  DateTime? _fetchedAt;
  bool _loading = false;
  bool _disposed = false;

  AppConfig get config => _config;

  Future<void> load() async {
    final cached = await _cache.read();
    if (cached != null && !_config.fromServer && !_disposed) {
      _config = cached;
      notifyListeners();
    }
    await refresh(force: true);
  }

  Future<void> refresh({bool force = false}) async {
    if (_loading || _disposed) return;
    final last = _fetchedAt;
    if (!force &&
        last != null &&
        _now().difference(last) < const Duration(minutes: 5)) {
      return;
    }
    _loading = true;
    try {
      final next = await _repository.fetch();
      if (_disposed) return;
      _fetchedAt = _now();
      if (next.fromServer) await _cache.write(next);
      _config = next;
      notifyListeners();
    } catch (_) {
      // Keep what we have; the next start or resume tries again.
    } finally {
      _loading = false;
    }
  }

  @override
  void dispose() {
    _disposed = true;
    super.dispose();
  }
}

/// Makes the config reachable from any screen.
class AppConfigScope extends InheritedNotifier<AppConfigController> {
  const AppConfigScope({
    required AppConfigController controller,
    required super.child,
    super.key,
  }) : super(notifier: controller);

  /// The current config, or the built-in values where no scope exists
  /// (widget tests of single screens).
  /// Without listening, for initState (controllers created once).
  static AppConfig read(BuildContext context) =>
      context
          .getInheritedWidgetOfExactType<AppConfigScope>()
          ?.notifier
          ?.config ??
      AppConfig.builtIn;

  static AppConfig of(BuildContext context) =>
      context
          .dependOnInheritedWidgetOfExactType<AppConfigScope>()
          ?.notifier
          ?.config ??
      AppConfig.builtIn;
}

/// Shorthand: `context.appConfig`.
extension AppConfigContext on BuildContext {
  AppConfig get appConfig => AppConfigScope.of(this);

  /// A specialty's English name from the server, in the app's language.
  String specialtyLabel(String englishName) => AppConfigScope.of(
    this,
  ).localizedSpecialty(englishName, Localizations.localeOf(this));
}
