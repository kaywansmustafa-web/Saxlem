import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/config/theme/app_theme.dart';
import 'package:saxlem_app/features/home/presentation/pages/home_page.dart';
import 'package:saxlem_app/features/discover/discover_feature.dart';
import 'package:saxlem_app/features/discover/domain/entities/doctor_discovery_options.dart';
import 'package:saxlem_app/features/discover/domain/entities/doctor_discovery_result.dart';
import 'package:saxlem_app/features/discover/domain/entities/doctor_search_criteria.dart';
import 'package:saxlem_app/features/discover/domain/entities/doctor_search_page.dart';
import 'package:saxlem_app/features/discover/domain/repositories/doctor_discovery_repository.dart';

void main() {
  testWidgets('opens Discover from bottom navigation and dashboard search', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        home: HomePage(doctorDiscoveryRepository: _EmptyRepository()),
      ),
    );
    await tester.tap(find.text('Discover'));
    await tester.pumpAndSettle();
    expect(find.text('No doctors found'), findsOneWidget);

    await tester.tap(find.text('Home'));
    await tester.pump();
    await tester.tap(find.text('Search doctors, clinics or specialties'));
    await tester.pump();
    expect(find.byType(TextField), findsOneWidget);
  });

  testWidgets('Discover supports RTL and 200 percent text scaling', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        home: Directionality(
          textDirection: TextDirection.rtl,
          child: MediaQuery(
            data: const MediaQueryData(textScaler: TextScaler.linear(2)),
            child: Scaffold(
              body: DiscoverFeature(repository: _EmptyRepository()),
            ),
          ),
        ),
      ),
    );
    await tester.enterText(find.byType(TextField), 'tooth pain');
    await tester.pump(const Duration(seconds: 1));

    expect(tester.takeException(), isNull);
    expect(find.textContaining('doctors'), findsWidgets);
  });
}

class _EmptyRepository implements DoctorDiscoveryRepository {
  @override
  Future<DoctorDiscoveryOptions> loadOptions() async =>
      const DoctorDiscoveryOptions(
        specialties: [],
        clinics: [],
        languages: [],
        genders: [],
        minimumExperience: null,
        maximumExperience: null,
      );
  @override
  Future<DoctorSearchPage> search(
    DoctorSearchCriteria criteria, {
    required int page,
    int pageSize = 20,
  }) async => DoctorSearchPage(
    results: const [],
    page: page,
    pageSize: pageSize,
    totalCount: 0,
    totalPages: 0,
  );
  @override
  Future<DoctorDiscoveryResult> loadDoctor(String doctorId) =>
      throw UnimplementedError();
}
