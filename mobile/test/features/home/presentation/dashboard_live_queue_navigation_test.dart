import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/config/theme/app_theme.dart';
import 'package:saxlem_app/features/home/presentation/pages/home_page.dart';

void main() {
  testWidgets('dashboard exposes no fabricated queue navigation or metrics', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(theme: AppTheme.light, home: const HomePage()),
    );
    expect(find.text('View live queue'), findsNothing);
    expect(find.text('Patients ahead'), findsNothing);
    expect(find.text('Popular specialties'), findsOneWidget);
  });
}
