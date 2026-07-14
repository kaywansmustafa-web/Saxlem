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

  testWidgets('shows the complete patient dashboard', (tester) async {
    await tester.pumpWidget(buildSubject());

    expect(find.text('Live queue'), findsOneWidget);
    expect(find.text('Popular specialties'), findsOneWidget);
    expect(find.text('Recommended doctors'), findsOneWidget);
    expect(find.text('Patients ahead'), findsOneWidget);
    expect(find.text('Book'), findsWidgets);
  });

  testWidgets('renders the dashboard in RTL', (tester) async {
    await tester.pumpWidget(buildSubject(direction: TextDirection.rtl));
    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
    expect(find.text('Live queue'), findsOneWidget);
  });
}
