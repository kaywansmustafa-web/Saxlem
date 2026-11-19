import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Light or dark: the same as the phone (default), or always one of them.
enum AppAppearance {
  system(ThemeMode.system),
  light(ThemeMode.light),
  dark(ThemeMode.dark);

  const AppAppearance(this.themeMode);
  final ThemeMode themeMode;
}

/// Where the choice is kept between launches.
abstract interface class AppearanceStore {
  Future<AppAppearance> load();
  Future<void> save(AppAppearance value);
}

class SharedPreferencesAppearanceStore implements AppearanceStore {
  const SharedPreferencesAppearanceStore();
  static const _key = 'saxlem.appearance';

  @override
  Future<AppAppearance> load() async {
    try {
      final name = (await SharedPreferences.getInstance()).getString(_key);
      return AppAppearance.values.firstWhere(
        (value) => value.name == name,
        orElse: () => AppAppearance.system,
      );
    } catch (_) {
      return AppAppearance.system;
    }
  }

  @override
  Future<void> save(AppAppearance value) async {
    try {
      await (await SharedPreferences.getInstance()).setString(_key, value.name);
    } catch (_) {
      // Keeping the choice is a convenience; the app still switches now.
    }
  }
}

class MemoryAppearanceStore implements AppearanceStore {
  MemoryAppearanceStore([this.value = AppAppearance.system]);
  AppAppearance value;
  @override
  Future<AppAppearance> load() async => value;
  @override
  Future<void> save(AppAppearance value) async => this.value = value;
}

class AppearanceController extends ChangeNotifier {
  AppearanceController(this._store);
  final AppearanceStore _store;
  AppAppearance value = AppAppearance.system;

  ThemeMode get themeMode => value.themeMode;

  Future<void> load() async {
    value = await _store.load();
    notifyListeners();
  }

  Future<void> select(AppAppearance next) async {
    if (next == value) return;
    value = next;
    notifyListeners();
    await _store.save(next);
  }
}

/// Makes the appearance choice reachable from Settings.
class AppearanceScope extends InheritedNotifier<AppearanceController> {
  const AppearanceScope({
    required AppearanceController controller,
    required super.child,
    super.key,
  }) : super(notifier: controller);

  static AppearanceController? maybeOf(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<AppearanceScope>()?.notifier;
}
