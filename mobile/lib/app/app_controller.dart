import 'package:flutter/foundation.dart';
import '../core/localization/supported_app_locale.dart';
import '../features/language/domain/repositories/locale_repository.dart';
import '../features/authentication/domain/entities/auth_session.dart';
import '../features/authentication/domain/repositories/auth_repository.dart';

enum AppBootstrapStatus {
  loading,
  needsLocale,
  needsAuthentication,
  sessionExpired,
  authenticationUnavailable,
  malformedLocalSession,
  ready,
}

class AppController extends ChangeNotifier {
  AppController(this._localeRepository, this._authRepository);
  final LocaleRepository _localeRepository;
  final AuthRepository _authRepository;

  AppBootstrapStatus status = AppBootstrapStatus.loading;
  SupportedAppLocale? selectedLocale;
  bool savingLocale = false;
  String? localeFailure;
  AuthSession session = const AuthSession.initializing();
  bool guestMode = false;

  static const minimumSplashDuration = Duration(milliseconds: 1200);

  Future<void> load() async {
    final startedAt = DateTime.now();
    try {
      selectedLocale = await _localeRepository.load();
      if (selectedLocale == null) {
        status = AppBootstrapStatus.needsLocale;
      } else {
        await _restoreSession();
      }
    } catch (_) {
      status = AppBootstrapStatus.needsLocale;
      localeFailure = 'load';
    }
    final elapsed = DateTime.now().difference(startedAt);
    final remaining = minimumSplashDuration - elapsed;
    if (remaining > Duration.zero) await Future<void>.delayed(remaining);
    notifyListeners();
  }

  Future<bool> selectLocale(SupportedAppLocale locale) async {
    if (savingLocale) return false;
    savingLocale = true;
    localeFailure = null;
    notifyListeners();
    try {
      await _localeRepository.save(locale);
      selectedLocale = locale;
      await _restoreSession();
      return true;
    } catch (_) {
      localeFailure = 'save';
      return false;
    } finally {
      savingLocale = false;
      notifyListeners();
    }
  }

  Future<void> _restoreSession() async {
    try {
      session = await _authRepository.restoreSession();
    } catch (_) {
      session = const AuthSession.restorationUnavailable();
    }
    status = switch (session.status) {
      AuthSessionStatus.initializing => AppBootstrapStatus.loading,
      AuthSessionStatus.guest => AppBootstrapStatus.needsAuthentication,
      AuthSessionStatus.authenticated => AppBootstrapStatus.ready,
      AuthSessionStatus.sessionExpired => AppBootstrapStatus.sessionExpired,
      AuthSessionStatus.restorationUnavailable =>
        AppBootstrapStatus.authenticationUnavailable,
      AuthSessionStatus.malformedLocalSession =>
        AppBootstrapStatus.malformedLocalSession,
    };
    guestMode = false;
  }

  void authenticated(AuthSession value) {
    session = value;
    guestMode = false;
    status = AppBootstrapStatus.ready;
    notifyListeners();
  }

  void continueAsGuest() {
    session = const AuthSession.guest();
    guestMode = true;
    status = AppBootstrapStatus.ready;
    notifyListeners();
  }

  Future<void> logout() async {
    await _authRepository.logout();
    session = const AuthSession.guest();
    guestMode = false;
    status = AppBootstrapStatus.needsAuthentication;
    notifyListeners();
  }
}
