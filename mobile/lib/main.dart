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
import 'features/authentication/data/storage/secure_session_storage.dart';
import 'features/authentication/domain/repositories/auth_repository.dart';
import 'features/authentication/presentation/authentication_feature.dart';
import 'app/app_dependencies.dart';
import 'config/environment/app_configuration.dart';

void main() {
  final dependencies = AppDependencies.create(
    configuration: AppConfiguration.fromCompileTime(),
    sessionStorage: const SecureSessionStorage(FlutterSecureStorage()),
  );
  runApp(
    SaxlemApp(
      authRepository: dependencies.authRepository,
      developmentOtp: dependencies.developmentOtp,
    ),
  );
}

class SaxlemApp extends StatelessWidget {
  const SaxlemApp({
    this.localeRepository,
    required this.authRepository,
    this.developmentOtp,
    super.key,
  });
  final LocaleRepository? localeRepository;
  final AuthRepository authRepository;
  final String? developmentOtp;

  @override
  Widget build(BuildContext context) {
    return _AppBootstrap(
      localeRepository: localeRepository ?? SharedPreferencesLocaleRepository(),
      authRepository: authRepository,
      developmentOtp: developmentOtp,
    );
  }
}

class _AppBootstrap extends StatefulWidget {
  const _AppBootstrap({
    required this.localeRepository,
    required this.authRepository,
    this.developmentOtp,
  });
  final LocaleRepository localeRepository;
  final AuthRepository authRepository;
  final String? developmentOtp;
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
          developmentOtp: widget.developmentOtp,
        ),
        AppBootstrapStatus.sessionExpired => AuthenticationFeature(
          repository: widget.authRepository,
          sessionExpired: true,
          onAuthenticated: controller.authenticated,
          onGuest: controller.continueAsGuest,
          developmentOtp: widget.developmentOtp,
        ),
        AppBootstrapStatus.ready => HomePage(
          guestMode: controller.guestMode,
          onLogout: controller.logout,
        ),
      },
    ),
  );
}
