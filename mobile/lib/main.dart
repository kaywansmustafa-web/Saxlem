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
import 'core/device/device_identity.dart';
import 'core/storage/secure_key_value_store.dart';
import 'features/authentication/data/storage/secure_session_storage.dart';
import 'features/authentication/domain/repositories/auth_repository.dart';
import 'features/authentication/domain/entities/auth_session.dart';
import 'features/authentication/presentation/authentication_feature.dart';
import 'app/app_dependencies.dart';
import 'config/environment/app_configuration.dart';
import 'features/family_profiles/data/repositories/in_memory_patient_profiles_repository.dart';
import 'features/family_profiles/presentation/controllers/patient_profiles_controller.dart';
import 'features/family_profiles/domain/repositories/patient_profiles_repository.dart';
import 'features/family_profiles/data/repositories/unavailable_patient_profiles_repository.dart';
import 'features/family_profiles/presentation/pages/primary_profile_setup_page.dart';
import 'core/localization/localization_extensions.dart';
import 'features/discover/domain/repositories/doctor_discovery_repository.dart';
import 'features/discover/data/repositories/unavailable_doctor_discovery_repository.dart';
import 'features/booking/domain/repositories/booking_repository.dart';
import 'features/booking/data/repositories/backend_booking_repository.dart';
import 'features/appointments/domain/repositories/patient_appointments_repository.dart';
import 'features/appointments/data/repositories/backend_patient_appointments_repository.dart';

void main() {
  const secureStorage = FlutterSecureStorage();
  const secureStore = FlutterSecureKeyValueStore(secureStorage);
  final dependencies = AppDependencies.create(
    configuration: AppConfiguration.fromCompileTime(),
    sessionStorage: const SecureSessionStorage(secureStore),
    deviceIdentity: SecureDeviceIdentity(secureStore),
  );
  runApp(
    SaxlemApp(
      authRepository: dependencies.authRepository,
      developmentOtp: dependencies.developmentOtp,
      patientProfilesRepository: dependencies.patientProfilesRepository,
      doctorDiscoveryRepository: dependencies.doctorDiscoveryRepository,
      bookingRepository: dependencies.bookingRepository,
      appointmentsRepository: dependencies.appointmentsRepository,
    ),
  );
}

class SaxlemApp extends StatelessWidget {
  const SaxlemApp({
    this.localeRepository,
    required this.authRepository,
    this.developmentOtp,
    this.patientProfilesRepository,
    this.doctorDiscoveryRepository =
        const UnavailableDoctorDiscoveryRepository(),
    this.bookingRepository = const UnavailableBookingRepository(),
    this.appointmentsRepository =
        const UnavailablePatientAppointmentsRepository(),
    super.key,
  });
  final LocaleRepository? localeRepository;
  final AuthRepository authRepository;
  final String? developmentOtp;
  final PatientProfilesRepository? patientProfilesRepository;
  final DoctorDiscoveryRepository doctorDiscoveryRepository;
  final BookingRepository bookingRepository;
  final PatientAppointmentsRepository appointmentsRepository;

  @override
  Widget build(BuildContext context) {
    return _AppBootstrap(
      localeRepository: localeRepository ?? SharedPreferencesLocaleRepository(),
      authRepository: authRepository,
      developmentOtp: developmentOtp,
      patientProfilesRepository: patientProfilesRepository,
      doctorDiscoveryRepository: doctorDiscoveryRepository,
      bookingRepository: bookingRepository,
      appointmentsRepository: appointmentsRepository,
    );
  }
}

class _AppBootstrap extends StatefulWidget {
  const _AppBootstrap({
    required this.localeRepository,
    required this.authRepository,
    this.developmentOtp,
    this.patientProfilesRepository,
    required this.doctorDiscoveryRepository,
    required this.bookingRepository,
    required this.appointmentsRepository,
  });
  final LocaleRepository localeRepository;
  final AuthRepository authRepository;
  final String? developmentOtp;
  final PatientProfilesRepository? patientProfilesRepository;
  final DoctorDiscoveryRepository doctorDiscoveryRepository;
  final BookingRepository bookingRepository;
  final PatientAppointmentsRepository appointmentsRepository;
  @override
  State<_AppBootstrap> createState() => _AppBootstrapState();
}

class _AppBootstrapState extends State<_AppBootstrap> {
  late final AppController controller;
  late final PatientProfilesController profiles;
  late final PatientProfilesController guestProfiles;
  bool _resolvingAccount = false;
  @override
  void initState() {
    super.initState();
    controller = AppController(widget.localeRepository, widget.authRepository)
      ..addListener(_onAppChanged)
      ..load();
    profiles = PatientProfilesController(
      widget.patientProfilesRepository ??
          const UnavailablePatientProfilesRepository(),
      guest: false,
    );
    guestProfiles = PatientProfilesController(
      InMemoryPatientProfilesRepository(),
      guest: true,
    )..load();
  }

  @override
  void dispose() {
    controller.dispose();
    profiles.dispose();
    guestProfiles.dispose();
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
          onAuthenticated: _authenticated,
          onGuest: controller.continueAsGuest,
          developmentOtp: widget.developmentOtp,
        ),
        AppBootstrapStatus.sessionExpired => AuthenticationFeature(
          repository: widget.authRepository,
          sessionExpired: true,
          onAuthenticated: _authenticated,
          onGuest: controller.continueAsGuest,
          developmentOtp: widget.developmentOtp,
        ),
        AppBootstrapStatus.authenticationUnavailable ||
        AppBootstrapStatus.malformedLocalSession => AuthenticationFeature(
          repository: widget.authRepository,
          onAuthenticated: _authenticated,
          onGuest: controller.continueAsGuest,
          developmentOtp: widget.developmentOtp,
        ),
        AppBootstrapStatus.ready => _readyContent(),
      },
    ),
  );

  void _authenticated(AuthSession session) {
    controller.authenticated(session);
    _resolveAccount();
  }

  void _onAppChanged() {
    if (controller.status == AppBootstrapStatus.ready &&
        !controller.guestMode) {
      _resolveAccount();
    }
  }

  Future<void> _resolveAccount() async {
    if (_resolvingAccount ||
        controller.guestMode ||
        widget.patientProfilesRepository == null) {
      return;
    }
    _resolvingAccount = true;
    final loaded = await profiles.load();
    final accountId = profiles.snapshot?.accountId;
    if (loaded && accountId != null) {
      controller.patientAccountResolved(accountId);
    }
    _resolvingAccount = false;
    if (mounted) setState(() {});
  }

  Widget _readyContent() {
    if (controller.guestMode) return _readyHome(guestProfiles);
    return ListenableBuilder(
      listenable: profiles,
      builder: (context, _) => switch (profiles.status) {
        PatientProfilesStatus.ready ||
        PatientProfilesStatus.offline => _readyHome(profiles),
        PatientProfilesStatus.setupRequired => PrimaryProfileSetupPage(
          controller: profiles,
        ),
        PatientProfilesStatus.sessionExpired => AuthenticationFeature(
          repository: widget.authRepository,
          sessionExpired: true,
          onAuthenticated: _authenticated,
          onGuest: controller.continueAsGuest,
          developmentOtp: widget.developmentOtp,
        ),
        PatientProfilesStatus.error ||
        PatientProfilesStatus.malformed => _AccountRecovery(
          malformed: profiles.status == PatientProfilesStatus.malformed,
          onRetry: _resolveAccount,
        ),
        _ => const SplashScreen(),
      },
    );
  }

  Widget _readyHome(PatientProfilesController activeProfiles) {
    return HomePage(
      guestMode: controller.guestMode,
      onLogout: _logout,
      profilesController: activeProfiles,
      doctorDiscoveryRepository: widget.doctorDiscoveryRepository,
      bookingRepository: widget.bookingRepository,
      appointmentsRepository: widget.appointmentsRepository,
    );
  }

  Future<void> _logout() async {
    profiles.clear();
    await controller.logout();
  }
}

class _AccountRecovery extends StatelessWidget {
  const _AccountRecovery({required this.malformed, required this.onRetry});
  final bool malformed;
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) => Scaffold(
    body: Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            malformed
                ? context.l10n.patientAccountInvalid
                : context.l10n.patientAccountUnavailable,
          ),
          const SizedBox(height: 16),
          FilledButton(onPressed: onRetry, child: Text(context.l10n.tryAgain)),
        ],
      ),
    ),
  );
}
