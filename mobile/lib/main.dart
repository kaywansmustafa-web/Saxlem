import 'package:flutter/material.dart';

import 'config/theme/app_theme.dart';
import 'app/app_controller.dart';
import 'features/language/data/repositories/shared_preferences_locale_repository.dart';
import 'features/language/domain/repositories/locale_repository.dart';
import 'features/splash/splash_screen.dart';
import 'features/language/language_selection_screen.dart';
import 'features/home/presentation/pages/home_page.dart';
import 'l10n/app_localizations.dart';
import 'core/localization/badini_framework_localizations.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'features/authentication/data/repositories/mock_auth_repository.dart';
import 'features/authentication/data/storage/secure_session_storage.dart';
import 'features/authentication/domain/repositories/auth_repository.dart';
import 'features/authentication/presentation/authentication_feature.dart';

void main() {
  runApp(const SaxlemApp());
}

class SaxlemApp extends StatelessWidget {
  const SaxlemApp({this.localeRepository, this.authRepository, super.key});
  final LocaleRepository? localeRepository;
  final AuthRepository? authRepository;

  @override
  Widget build(BuildContext context) {
    final authentication =
        authRepository ??
        MockAuthRepository(const SecureSessionStorage(FlutterSecureStorage()));
    return _AppBootstrap(
      localeRepository: localeRepository ?? SharedPreferencesLocaleRepository(),
      authRepository: authentication,
    );
  }
}

class _AppBootstrap extends StatefulWidget {
  const _AppBootstrap({
    required this.localeRepository,
    required this.authRepository,
  });
  final LocaleRepository localeRepository;
  final AuthRepository authRepository;
  @override
  State<_AppBootstrap> createState() => _AppBootstrapState();
}

class _AppBootstrapState extends State<_AppBootstrap> {
  late final AppController controller;
  @override
  void initState() {
    super.initState();
    controller = AppController(widget.localeRepository, widget.authRepository)
      ..load();
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
      localizationsDelegates: [
        ...badiniFrameworkLocalizationsDelegates,
        ...AppLocalizations.localizationsDelegates,
      ],
      home: switch (controller.status) {
        AppBootstrapStatus.loading => const SplashScreen(),
        AppBootstrapStatus.needsLocale => LanguageSelectionScreen(
          controller: controller,
        ),
        AppBootstrapStatus.needsAuthentication => AuthenticationFeature(
          repository: widget.authRepository,
          onAuthenticated: controller.authenticated,
          onGuest: controller.continueAsGuest,
        ),
        AppBootstrapStatus.sessionExpired => AuthenticationFeature(
          repository: widget.authRepository,
          sessionExpired: true,
          onAuthenticated: controller.authenticated,
          onGuest: controller.continueAsGuest,
        ),
        AppBootstrapStatus.ready => HomePage(
          guestMode: controller.guestMode,
          onLogout: controller.logout,
        ),
      },
    ),
  );
}
