import '../../../../core/localization/supported_app_locale.dart';

abstract interface class LocaleRepository {
  Future<SupportedAppLocale?> load();
  Future<void> save(SupportedAppLocale locale);
}
