import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/config/theme/app_theme.dart';
import 'package:saxlem_app/features/home/presentation/pages/home_page.dart';

void main() {
  Widget buildSubject({TextDirection direction = TextDirection.ltr}) {
    return MaterialApp(
      theme: AppTheme.light,
      home: Directionality(textDirection: direction, child: const HomePage()),
    );
  }

  testWidgets('shows the patient dashboard without placeholder data', (
    tester,
  ) async {
    await tester.pumpWidget(buildSubject());
    await tester.pumpAndSettle();

    expect(find.text('Live queue'), findsNothing);
    // Without a doctor directory, Home still offers the specialty shortcuts.
    expect(find.text('Popular specialties'), findsOneWidget);
    // Emergency is always one (confirmed) tap away.
    expect(find.text('Emergency'), findsOneWidget);
    expect(find.text('Find and book trusted doctors'), findsOneWidget);
    expect(find.text('Patients ahead'), findsNothing);
    // No placeholder people, ratings or prices: home shows only real data.
    expect(find.text('Recommended doctors'), findsNothing);
    expect(find.textContaining('Dr.'), findsNothing);
    expect(find.textContaining('IQD'), findsNothing);
    expect(find.text('Kaywan'), findsNothing);
  });

  testWidgets('renders the dashboard in RTL', (tester) async {
    await tester.pumpWidget(buildSubject(direction: TextDirection.rtl));
    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
    expect(find.text('Live queue'), findsNothing);
  });
}
