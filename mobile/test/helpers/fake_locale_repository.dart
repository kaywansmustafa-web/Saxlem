import 'package:saxlem_app/core/localization/supported_app_locale.dart';
import 'package:saxlem_app/features/language/domain/repositories/locale_repository.dart';

class FakeLocaleRepository implements LocaleRepository {
  FakeLocaleRepository({
    this.value,
    this.failLoad = false,
    this.failSave = false,
  });
  SupportedAppLocale? value;
  final bool failLoad;
  final bool failSave;
  @override
  Future<SupportedAppLocale?> load() async {
    if (failLoad) throw StateError('load failed');
    return value;
  }

  @override
  Future<void> save(SupportedAppLocale locale) async {
    if (failSave) throw StateError('save failed');
    value = locale;
  }
}
