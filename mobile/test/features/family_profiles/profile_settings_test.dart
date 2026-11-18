import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/config/theme/app_theme.dart';
import 'package:saxlem_app/core/formatting/clinic_format.dart';
import 'package:saxlem_app/core/localization/supported_app_locale.dart';
import 'package:saxlem_app/features/family_profiles/data/repositories/in_memory_patient_profiles_repository.dart';
import 'package:saxlem_app/features/family_profiles/domain/repositories/patient_profiles_repository.dart';
import 'package:saxlem_app/features/family_profiles/presentation/controllers/patient_profiles_controller.dart';
import 'package:saxlem_app/features/family_profiles/presentation/pages/patient_profiles_page.dart';
import 'package:saxlem_app/l10n/app_localizations.dart';

class _BusyRepository extends InMemoryPatientProfilesRepository {
  @override
  Future<DeleteAccountOutcome> deleteAccount() async =>
      DeleteAccountOutcome.upcomingAppointments;
}

Future<void> _pump(
  WidgetTester tester,
  PatientProfilesController controller, {
  Future<void> Function()? onLogout,
  Future<bool> Function(SupportedAppLocale)? onChangeLanguage,
  Locale locale = const Locale('en'),
}) async {
  await tester.pumpWidget(
    MaterialApp(
      theme: AppTheme.light,
      locale: locale,
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      home: Scaffold(
        body: PatientProfilesPage(
          controller: controller,
          onLogout: onLogout,
          onChangeLanguage: onChangeLanguage,
        ),
      ),
    ),
  );
  await controller.load();
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('a patient can delete their account and is signed out', (
    tester,
  ) async {
    final controller = PatientProfilesController(
      InMemoryPatientProfilesRepository(),
      guest: false,
    );
    var signedOut = false;
    await _pump(tester, controller, onLogout: () async => signedOut = true);
    await tester.scrollUntilVisible(find.text('Delete account'), 200);
    await tester.tap(find.text('Delete account'));
    await tester.pumpAndSettle();
    expect(find.text('Delete your Saxlem account?'), findsOneWidget);
    await tester.tap(find.text('Delete my account'));
    await tester.pumpAndSettle();
    expect(signedOut, isTrue);
  });

  testWidgets('deletion waits until upcoming visits are cancelled', (
    tester,
  ) async {
    final controller = PatientProfilesController(
      _BusyRepository(),
      guest: false,
    );
    var signedOut = false;
    await _pump(tester, controller, onLogout: () async => signedOut = true);
    await tester.scrollUntilVisible(find.text('Delete account'), 200);
    await tester.tap(find.text('Delete account'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Delete my account'));
    await tester.pumpAndSettle();
    expect(signedOut, isFalse);
    expect(
      find.text('Cancel your upcoming appointments first, then try again.'),
      findsOneWidget,
    );
  });

  testWidgets('the app language can be changed from Settings', (tester) async {
    final controller = PatientProfilesController(
      InMemoryPatientProfilesRepository(),
      guest: false,
    );
    SupportedAppLocale? chosen;
    await _pump(
      tester,
      controller,
      onLogout: () async {},
      onChangeLanguage: (locale) async {
        chosen = locale;
        return true;
      },
    );
    await tester.scrollUntilVisible(find.text('App language'), 200);
    await tester.tap(find.text('App language'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('کوردی (بادینی)').last);
    await tester.pumpAndSettle();
    expect(chosen, SupportedAppLocale.badini);
  });

  test('dates and money read the same in every language', () {
    expect(ClinicFormat.day(DateTime(2030, 8, 10), 'en'), '10 Aug 2030');
    expect(ClinicFormat.day(DateTime(2030, 8, 10), 'ar'), '10 آب 2030');
    expect(ClinicFormat.day(DateTime(2030, 8, 10), 'ku'), '10 تەباخ 2030');
    expect(ClinicFormat.number(25000), '25,000');
    expect(ClinicFormat.number(-1250), '-1,250');
  });
}
