import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/config/theme/app_theme.dart';
import 'package:saxlem_app/features/notifications/data/data_sources/mock_notifications_data_source.dart';
import 'package:saxlem_app/features/notifications/data/mappers/patient_notification_mapper.dart';
import 'package:saxlem_app/features/notifications/data/repositories/in_memory_notifications_repository.dart';
import 'package:saxlem_app/features/notifications/notifications_feature.dart';
import 'package:saxlem_app/features/notifications/presentation/controllers/notifications_controller.dart';
import 'package:saxlem_app/l10n/app_localizations.dart';

void main() {
  testWidgets('renders queue grouping at RTL and 200 percent text', (
    tester,
  ) async {
    final repository = InMemoryNotificationsRepository(
      MockNotificationsDataSource(now: () => DateTime(2026, 7, 15, 10)),
      const PatientNotificationMapper(),
    );
    final controller = NotificationsController(
      repository,
      now: () => DateTime(2026, 7, 15, 10),
    )..load();
    addTearDown(controller.dispose);
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        locale: const Locale('ar'),
        supportedLocales: AppLocalizations.supportedLocales,
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        home: MediaQuery(
          data: const MediaQueryData(textScaler: TextScaler.linear(2)),
          child: Scaffold(body: NotificationsFeature(controller: controller)),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.textContaining('2'), findsWidgets);
    expect(
      Directionality.of(tester.element(find.byType(NotificationsFeature))),
      TextDirection.rtl,
    );
    expect(tester.takeException(), isNull);
  });
}
