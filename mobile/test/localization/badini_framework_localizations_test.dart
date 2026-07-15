import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/core/localization/badini_framework_localizations.dart';
import 'package:saxlem_app/l10n/app_localizations.dart';

void main() {
  testWidgets('Badini provides Material and Cupertino framework strings', (
    tester,
  ) async {
    late BuildContext pageContext;

    await tester.pumpWidget(
      MaterialApp(
        locale: const Locale('ku'),
        supportedLocales: AppLocalizations.supportedLocales,
        localizationsDelegates: [
          ...badiniFrameworkLocalizationsDelegates,
          ...AppLocalizations.localizationsDelegates,
        ],
        home: Builder(
          builder: (context) {
            pageContext = context;
            return const Scaffold(body: Text('Saxlem'));
          },
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(MaterialLocalizations.of(pageContext), isNotNull);
    expect(CupertinoLocalizations.of(pageContext), isNotNull);
    expect(Directionality.of(pageContext), TextDirection.rtl);
    expect(tester.takeException(), isNull);
  });
}
