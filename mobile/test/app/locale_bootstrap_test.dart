import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/core/localization/supported_app_locale.dart';
import 'package:saxlem_app/features/home/presentation/pages/home_page.dart';
import 'package:saxlem_app/features/language/language_selection_screen.dart';
import 'package:saxlem_app/main.dart';
import 'package:saxlem_app/features/authentication/domain/entities/auth_session.dart';
import '../helpers/fake_locale_repository.dart';
import '../helpers/fake_auth_repository.dart';

void main() {
  testWidgets('first launch selects and persists an RTL locale', (
    tester,
  ) async {
    final repository = FakeLocaleRepository();
    await tester.pumpWidget(
      SaxlemApp(
        localeRepository: repository,
        authRepository: FakeAuthRepository(
          session: const AuthSession.authenticated(
            userId: 'patient',
            phoneNumber: '+9647501234567',
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.byType(LanguageSelectionScreen), findsOneWidget);
    await tester.tap(find.text('العربية'));
    await tester.pump();
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();
    expect(repository.value, SupportedAppLocale.arabic);
    expect(find.byType(HomePage), findsOneWidget);
    expect(
      Directionality.of(tester.element(find.byType(HomePage))),
      TextDirection.rtl,
    );
  });

  testWidgets('a persisted locale skips language selection', (tester) async {
    final repository = FakeLocaleRepository(value: SupportedAppLocale.english);
    await tester.pumpWidget(
      SaxlemApp(
        localeRepository: repository,
        authRepository: FakeAuthRepository(
          session: const AuthSession.authenticated(
            userId: 'patient',
            phoneNumber: '+9647501234567',
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.byType(HomePage), findsOneWidget);
    expect(find.byType(LanguageSelectionScreen), findsNothing);
  });
}
