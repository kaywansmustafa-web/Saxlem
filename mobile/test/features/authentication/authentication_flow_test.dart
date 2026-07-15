import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/features/authentication/domain/entities/auth_session.dart';
import 'package:saxlem_app/features/authentication/presentation/authentication_feature.dart';
import 'package:saxlem_app/l10n/app_localizations.dart';

import '../../helpers/fake_auth_repository.dart';

void main() {
  testWidgets('guest path clearly discloses its limitations', (tester) async {
    var guest = false;
    await tester.pumpWidget(
      MaterialApp(
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: AuthenticationFeature(
          repository: FakeAuthRepository(),
          onAuthenticated: (_) {},
          onGuest: () => guest = true,
        ),
      ),
    );
    await tester.ensureVisible(find.text('Continue as Guest'));
    await tester.tap(find.text('Continue as Guest'));
    await tester.pump();
    expect(guest, isTrue);
  });

  testWidgets('phone and OTP complete authentication', (tester) async {
    AuthSession? result;
    await tester.pumpWidget(
      MaterialApp(
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: AuthenticationFeature(
          repository: FakeAuthRepository(),
          onAuthenticated: (value) => result = value,
          onGuest: () {},
        ),
      ),
    );
    await tester.ensureVisible(find.text('Continue'));
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField), '07501234567');
    await tester.tap(find.text('Send code'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField), '123456');
    await tester.tap(find.text('Verify and continue'));
    await tester.pump();
    expect(result?.status, AuthSessionStatus.authenticated);
  });
}
