import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/features/language/language_selection_screen.dart';
import 'package:saxlem_app/features/splash/splash_screen.dart';
import 'package:saxlem_app/main.dart';

void main() {
  testWidgets('Saxlem starts with splash and opens language selection', (
    tester,
  ) async {
    await tester.pumpWidget(const SaxlemApp());

    expect(find.byType(SplashScreen), findsOneWidget);

    await tester.pump(const Duration(seconds: 3));
    await tester.pumpAndSettle();

    expect(find.byType(LanguageSelectionScreen), findsOneWidget);
    expect(find.text('Choose your language'), findsOneWidget);
  });
}
