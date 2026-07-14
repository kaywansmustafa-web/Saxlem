import 'package:flutter/foundation.dart';
import '../core/localization/supported_app_locale.dart';
import '../features/language/domain/repositories/locale_repository.dart';

enum AppBootstrapStatus { loading, needsLocale, ready }

class AppController extends ChangeNotifier {
  AppController(this._localeRepository);
  final LocaleRepository _localeRepository;

  AppBootstrapStatus status = AppBootstrapStatus.loading;
  SupportedAppLocale? selectedLocale;
  bool savingLocale = false;
  String? localeFailure;

  Future<void> load() async {
    try {
      selectedLocale = await _localeRepository.load();
      status = selectedLocale == null
          ? AppBootstrapStatus.needsLocale
          : AppBootstrapStatus.ready;
    } catch (_) {
      status = AppBootstrapStatus.needsLocale;
      localeFailure = 'load';
    }
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
      status = AppBootstrapStatus.ready;
      return true;
    } catch (_) {
      localeFailure = 'save';
      return false;
    } finally {
      savingLocale = false;
      notifyListeners();
    }
  }
}
