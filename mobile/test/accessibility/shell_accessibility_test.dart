import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/features/notifications/notifications_feature.dart';
import 'package:saxlem_app/features/home/presentation/pages/home_page.dart';
import 'package:saxlem_app/l10n/app_localizations.dart';
import 'dart:io';

void main() {
  testWidgets(
    'four-tab shell with the notifications bell supports Arabic RTL at 200 percent text',
    (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          locale: const Locale('ar'),
          supportedLocales: AppLocalizations.supportedLocales,
          localizationsDelegates: const [
            ...AppLocalizations.localizationsDelegates,
            GlobalWidgetsLocalizations.delegate,
          ],
          builder: (context, child) => MediaQuery(
            data: MediaQuery.of(
              context,
            ).copyWith(textScaler: const TextScaler.linear(2)),
            child: child!,
          ),
          home: const HomePage(),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('الرئيسية'), findsOneWidget);
      expect(find.text('الملف الشخصي'), findsOneWidget);
      // Notifications are no longer a tab: they open from the bell on Home.
      expect(find.text('الإشعارات'), findsNothing);
      await tester.tap(find.bySemanticsLabel('الإشعارات'));
      await tester.pumpAndSettle();
      expect(find.byType(NotificationsFeature), findsOneWidget);
      expect(tester.takeException(), isNull);
      expect(
        Directionality.of(
          tester.element(find.byType(HomePage, skipOffstage: false)),
        ),
        TextDirection.rtl,
      );
    },
  );

  test(
    'SharedPreferences is isolated to the locale repository implementation',
    () {
      final offenders =
          Directory('lib')
              .listSync(recursive: true)
              .whereType<File>()
              .where((file) => file.path.endsWith('.dart'))
              .where(
                (file) =>
                    file.readAsStringSync().contains('shared_preferences'),
              )
              .map((file) => file.path.replaceAll('\\', '/'))
              .toList()
            ..sort();
      expect(offenders, [
        'lib/features/language/data/repositories/shared_preferences_locale_repository.dart',
        'lib/main.dart',
      ]);
    },
  );
}
