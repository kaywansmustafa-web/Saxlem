import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/config/theme/app_theme.dart';
import 'package:saxlem_app/features/home/presentation/pages/home_page.dart';
import 'package:saxlem_app/features/discover/discover_feature.dart';

void main() {
  testWidgets('opens Discover from bottom navigation and dashboard search', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(theme: AppTheme.light, home: const HomePage()),
    );
    await tester.tap(find.text('Discover'));
    await tester.pump();
    expect(find.text('Find the right care'), findsOneWidget);

    await tester.tap(find.text('Home'));
    await tester.pump();
    await tester.tap(find.text('Search doctors, clinics or specialties'));
    await tester.pump();
    expect(find.byType(TextField), findsOneWidget);
  });

  testWidgets('Discover supports RTL and 200 percent text scaling', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        home: Directionality(
          textDirection: TextDirection.rtl,
          child: MediaQuery(
            data: const MediaQueryData(textScaler: TextScaler.linear(2)),
            child: const Scaffold(body: DiscoverFeature()),
          ),
        ),
      ),
    );
    await tester.enterText(find.byType(TextField), 'tooth pain');
    await tester.pump(const Duration(seconds: 1));

    expect(tester.takeException(), isNull);
    expect(find.textContaining('doctors'), findsWidgets);
  });
}
