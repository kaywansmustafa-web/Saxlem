import 'package:flutter/material.dart';

import 'config/theme/app_theme.dart';
import 'app/app_controller.dart';
import 'features/language/data/repositories/shared_preferences_locale_repository.dart';
import 'features/language/domain/repositories/locale_repository.dart';
import 'features/splash/splash_screen.dart';
import 'features/language/language_selection_screen.dart';
import 'features/home/presentation/pages/home_page.dart';
import 'l10n/app_localizations.dart';

void main() {
  runApp(const SaxlemApp());
}

class SaxlemApp extends StatelessWidget {
  const SaxlemApp({this.localeRepository, super.key});
  final LocaleRepository? localeRepository;

  @override
  Widget build(BuildContext context) => _AppBootstrap(
    localeRepository:
        localeRepository ?? SharedPreferencesLocaleRepository(),
  );
}

class _AppBootstrap extends StatefulWidget {
  const _AppBootstrap({required this.localeRepository});
  final LocaleRepository localeRepository;
  @override
  State<_AppBootstrap> createState() => _AppBootstrapState();
}

class _AppBootstrapState extends State<_AppBootstrap> {
  late final AppController controller;
  @override
  void initState() {
    super.initState();
    controller = AppController(widget.localeRepository)..load();
  }
  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }
  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: controller,
    builder: (context, _) => MaterialApp(
      onGenerateTitle: (context) => AppLocalizations.of(context).appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      locale: controller.selectedLocale?.locale,
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      home: switch (controller.status) {
        AppBootstrapStatus.loading => const SplashScreen(),
        AppBootstrapStatus.needsLocale => LanguageSelectionScreen(
          controller: controller,
        ),
        AppBootstrapStatus.ready => const HomePage(),
      },
    ),
  );
}
