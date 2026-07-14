import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/features/language/language_selection_screen.dart';
import 'package:saxlem_app/main.dart';
import 'helpers/fake_locale_repository.dart';

void main() {
  testWidgets('Saxlem opens language selection on first launch', (
    tester,
  ) async {
    await tester.pumpWidget(
      SaxlemApp(localeRepository: FakeLocaleRepository()),
    );

    await tester.pumpAndSettle();

    expect(find.byType(LanguageSelectionScreen), findsOneWidget);
    expect(find.text('Choose your language'), findsOneWidget);
  });
}
