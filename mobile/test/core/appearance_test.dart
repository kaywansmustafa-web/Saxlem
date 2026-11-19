import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/config/theme/app_theme.dart';
import 'package:saxlem_app/core/appearance/appearance.dart';
import 'package:saxlem_app/design_system/theme/saxlem_colors.dart';
import 'package:saxlem_app/features/family_profiles/data/repositories/in_memory_patient_profiles_repository.dart';
import 'package:saxlem_app/features/family_profiles/presentation/controllers/patient_profiles_controller.dart';
import 'package:saxlem_app/features/family_profiles/presentation/pages/patient_profiles_page.dart';
import 'package:saxlem_app/l10n/app_localizations.dart';

void main() {
  test(
    'follows the phone until the patient picks, and remembers the pick',
    () async {
      final store = MemoryAppearanceStore();
      final controller = AppearanceController(store);
      await controller.load();
      expect(controller.themeMode, ThemeMode.system);
      await controller.select(AppAppearance.dark);
      expect(controller.themeMode, ThemeMode.dark);
      expect(store.value, AppAppearance.dark);

      final again = AppearanceController(store);
      await again.load();
      expect(again.value, AppAppearance.dark);
    },
  );

  testWidgets('Settings → Appearance switches the whole app to dark', (
    tester,
  ) async {
    final appearance = AppearanceController(MemoryAppearanceStore());
    final profiles = PatientProfilesController(
      InMemoryPatientProfilesRepository(),
      guest: false,
    );
    await tester.pumpWidget(
      AppearanceScope(
        controller: appearance,
        child: ListenableBuilder(
          listenable: appearance,
          builder: (context, _) => MaterialApp(
            theme: AppTheme.light,
            darkTheme: AppTheme.dark,
            themeMode: appearance.themeMode,
            supportedLocales: AppLocalizations.supportedLocales,
            localizationsDelegates: AppLocalizations.localizationsDelegates,
            home: Scaffold(
              body: PatientProfilesPage(
                controller: profiles,
                onLogout: () async {},
              ),
            ),
          ),
        ),
      ),
    );
    await profiles.load();
    await tester.pumpAndSettle();

    expect(find.text('Appearance'), findsOneWidget);
    expect(find.text('Same as phone'), findsOneWidget);
    await tester.tap(find.text('Appearance'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Dark'));
    await tester.pumpAndSettle();

    expect(appearance.value, AppAppearance.dark);
    final context = tester.element(find.byType(PatientProfilesPage));
    expect(context.saxlemColors.isDark, isTrue);
    expect(Theme.of(context).brightness, Brightness.dark);
  });

  test('both themes carry their own Design A colours', () {
    expect(AppTheme.light.extension<SaxlemColors>()!.isDark, isFalse);
    expect(AppTheme.dark.extension<SaxlemColors>()!.isDark, isTrue);
    expect(AppTheme.dark.brightness, Brightness.dark);
    expect(AppTheme.dark.scaffoldBackgroundColor, SaxlemColors.dark.canvas);
  });
}
