import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:saxlem_app/l10n/app_localizations.dart';
import 'package:saxlem_app/features/live_queue/presentation/controllers/live_queue_controller.dart';
import 'package:saxlem_app/features/live_queue/presentation/pages/live_queue_page.dart';
import '../live_queue_test_helpers.dart';

void main() {
  testWidgets('renders authoritative patient queue snapshot', (tester) async {
    final controller = LiveQueueController(
      appointmentId: '11111111-1111-4111-8111-111111111111',
      repository: FakeQueueRepository(queueStatus()),
    );
    await controller.load();
    await tester.pumpWidget(
      MaterialApp(
        localizationsDelegates: const [
          AppLocalizations.delegate,
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
        ],
        supportedLocales: AppLocalizations.supportedLocales,
        home: LiveQueuePage(controller: controller),
      ),
    );
    expect(find.text('Please wait for your turn.'), findsOneWidget);
    expect(find.text('4'), findsOneWidget);
    controller.dispose();
  });
}
