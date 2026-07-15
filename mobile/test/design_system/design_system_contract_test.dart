import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/config/theme/app_theme.dart';
import 'package:saxlem_app/design_system/design_system.dart';

void main() {
  test('foundation tokens preserve the approved contracts', () {
    expect(SaxlemColors.light.brandPrimary, const Color(0xFF0B57D0));
    expect(SaxlemColors.light.brandSecondary, const Color(0xFF087F8C));
    expect(SaxlemSpacing.one, 8);
    expect(SaxlemRadii.card, 24);
    expect(SaxlemSizes.minimumTouchTarget, 48);
    expect(SaxlemButtonHierarchy.values, hasLength(3));
  });

  testWidgets('buttons expose exactly three accessible hierarchies', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        home: Scaffold(
          body: Column(
            children: SaxlemButtonHierarchy.values
                .map(
                  (hierarchy) => SaxlemButton(
                    label: hierarchy.name,
                    hierarchy: hierarchy,
                    onPressed: () {},
                  ),
                )
                .toList(),
          ),
        ),
      ),
    );
    expect(find.byType(FilledButton), findsOneWidget);
    expect(find.byType(OutlinedButton), findsOneWidget);
    expect(find.byType(TextButton), findsOneWidget);
    for (final hierarchy in SaxlemButtonHierarchy.values) {
      final size = tester.getSize(find.text(hierarchy.name));
      expect(size.height, greaterThan(0));
    }
  });

  testWidgets('state view supports RTL and 200 percent text', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        home: Directionality(
          textDirection: TextDirection.rtl,
          child: MediaQuery(
            data: const MediaQueryData(textScaler: TextScaler.linear(2)),
            child: const Scaffold(
              body: SaxlemStateView(
                kind: SaxlemStateKind.offline,
                title: 'لا يوجد اتصال',
                message: 'نعرض آخر تحديث محفوظ لديك.',
              ),
            ),
          ),
        ),
      ),
    );
    expect(tester.takeException(), isNull);
    expect(find.text('لا يوجد اتصال'), findsOneWidget);
  });

  testWidgets('responsive content enforces its maximum width', (tester) async {
    await tester.binding.setSurfaceSize(const Size(1400, 900));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: SaxlemResponsiveContent(
            maxWidth: 720,
            child: SizedBox(key: ValueKey('content'), width: double.infinity),
          ),
        ),
      ),
    );
    expect(tester.getSize(find.byKey(const ValueKey('content'))).width, 672);
  });
}
