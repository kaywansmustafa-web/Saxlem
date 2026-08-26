import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/config/theme/app_theme.dart';

void main() {
  test('maps locale to the approved family without changing English', () {
    expect(AppTheme.fontFamilyFor(const Locale('en')), isNull);
    expect(AppTheme.fontFamilyFor(const Locale('ar', 'IQ')), 'Cairo');
    expect(AppTheme.fontFamilyFor(const Locale('ku', 'IQ')), 'Rudaw');

    expect(
      AppTheme.lightFor(const Locale('ar')).textTheme.bodyMedium?.fontFamily,
      'Cairo',
    );
    expect(
      AppTheme.lightFor(const Locale('ku')).textTheme.bodyMedium?.fontFamily,
      'Rudaw',
    );
  });

  testWidgets('locale switching updates the inherited theme at large text', (
    tester,
  ) async {
    final locale = ValueNotifier(const Locale('ar', 'IQ'));
    addTearDown(locale.dispose);

    await tester.pumpWidget(
      ValueListenableBuilder<Locale>(
        valueListenable: locale,
        builder: (context, value, _) => MaterialApp(
          locale: value,
          theme: AppTheme.lightFor(value),
          builder: (context, child) => MediaQuery(
            data: MediaQuery.of(
              context,
            ).copyWith(textScaler: const TextScaler.linear(2)),
            child: child!,
          ),
          home: Builder(
            builder: (context) => Scaffold(
              body: Column(
                children: [
                  Text(
                    Theme.of(context).textTheme.bodyMedium?.fontFamily ??
                        'default',
                    key: const Key('family'),
                  ),
                  TextButton(
                    onPressed: () => locale.value = const Locale('ku', 'IQ'),
                    child: const Text('Badini'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );

    expect(find.text('Cairo'), findsOneWidget);
    await tester.tap(find.text('Badini'));
    await tester.pumpAndSettle();
    expect(find.text('Rudaw'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
