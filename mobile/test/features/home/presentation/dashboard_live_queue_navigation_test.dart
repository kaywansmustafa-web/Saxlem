import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/config/theme/app_theme.dart';
import 'package:saxlem_app/features/home/presentation/pages/home_page.dart';

void main() {
  testWidgets('opens live queue from the dashboard and returns safely', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(theme: AppTheme.light, home: const HomePage()),
    );

    await tester.tap(find.text('View live queue'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 700));
    expect(find.text('Live Queue'), findsOneWidget);

    await tester.pageBack();
    await tester.pumpAndSettle();
    expect(find.text('Popular specialties'), findsOneWidget);

    await tester.pumpWidget(const SizedBox.shrink());
  });
}
