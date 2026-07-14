import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/features/home/presentation/pages/home_page.dart';
import 'package:saxlem_app/l10n/app_localizations.dart';
import 'dart:io';

void main() {
  testWidgets('five-item shell supports Arabic RTL at 200 percent text', (
    tester,
  ) async {
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
    expect(find.text('التنبيهات'), findsOneWidget);
    expect(find.text('الملف الشخصي'), findsOneWidget);
    await tester.tap(find.text('التنبيهات'));
    await tester.pump();
    expect(find.text('التنبيهات قريباً'), findsOneWidget);
    expect(tester.takeException(), isNull);
    expect(
      Directionality.of(tester.element(find.byType(HomePage))),
      TextDirection.rtl,
    );
  });

  test(
    'SharedPreferences is isolated to the locale repository implementation',
    () {
      final offenders = Directory('lib')
          .listSync(recursive: true)
          .whereType<File>()
          .where((file) => file.path.endsWith('.dart'))
          .where(
            (file) => file.readAsStringSync().contains('shared_preferences'),
          )
          .map((file) => file.path.replaceAll('\\', '/'))
          .toList();
      expect(offenders, [
        'lib/features/language/data/repositories/shared_preferences_locale_repository.dart',
        'lib/main.dart',
      ]);
    },
  );
}
