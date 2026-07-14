import 'package:shared_preferences/shared_preferences.dart';
import '../../../../core/localization/supported_app_locale.dart';
import '../../domain/repositories/locale_repository.dart';

class SharedPreferencesLocaleRepository implements LocaleRepository {
  SharedPreferencesLocaleRepository({SharedPreferencesAsync? preferences})
    : _preferences = preferences ?? SharedPreferencesAsync();

  static const _key = 'saxlem.patient.locale';
  final SharedPreferencesAsync _preferences;

  @override
  Future<SupportedAppLocale?> load() async =>
      SupportedAppLocale.fromStorageKey(await _preferences.getString(_key));

  @override
  Future<void> save(SupportedAppLocale locale) =>
      _preferences.setString(_key, locale.storageKey);
}
