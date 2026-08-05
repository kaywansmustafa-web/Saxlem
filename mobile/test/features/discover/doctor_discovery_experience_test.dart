import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/config/theme/app_theme.dart';
import 'package:saxlem_app/features/discover/discover_feature.dart';
import 'package:saxlem_app/features/discover/domain/entities/doctor_discovery_options.dart';
import 'package:saxlem_app/features/discover/domain/entities/doctor_discovery_result.dart';
import 'package:saxlem_app/features/discover/domain/entities/doctor_search_criteria.dart';
import 'package:saxlem_app/features/discover/domain/entities/doctor_search_page.dart';
import 'package:saxlem_app/features/discover/domain/repositories/doctor_discovery_repository.dart';
import 'package:saxlem_app/l10n/app_localizations.dart';

void main() {
  testWidgets(
    'renders authoritative result fields without unsupported metrics',
    (tester) async {
      final repository = _Repository();
      await _pump(tester, repository);

      expect(find.text('Find a doctor'), findsOneWidget);
      expect(find.text('1 doctor'), findsOneWidget);
      expect(find.text('Dr Shilan Ahmed'), findsOneWidget);
      expect(find.text('Cardiology'), findsOneWidget);
      expect(find.text('12 years of experience'), findsOneWidget);
      expect(find.text('Saxlem Clinic'), findsOneWidget);
      for (final unsupported in [
        'rating',
        'reviews',
        'IQD',
        'distance',
        'verified',
        'wait',
        'recommended',
      ]) {
        expect(
          find.textContaining(unsupported, findRichText: true),
          findsNothing,
        );
      }
    },
  );

  testWidgets('guest state is honest and does not call repository', (
    tester,
  ) async {
    final repository = _Repository();
    await _pump(tester, repository, guest: true);

    expect(find.text('Sign in to find doctors'), findsOneWidget);
    expect(repository.optionsCalls, 0);
    expect(repository.searchCalls, 0);
  });

  for (final value in <DoctorDiscoveryFailureType, String>{
    DoctorDiscoveryFailureType.offline: 'You are offline',
    DoctorDiscoveryFailureType.forbidden: 'Doctor discovery is restricted',
    DoctorDiscoveryFailureType.unauthenticated: 'Your session has expired',
    DoctorDiscoveryFailureType.malformedResponse:
        'Doctor information is unavailable',
    DoctorDiscoveryFailureType.unavailable: 'Doctor discovery is unavailable',
  }.entries) {
    testWidgets('shows and announces ${value.key.name} state with retry', (
      tester,
    ) async {
      final repository = _Repository(failure: value.key);
      await _pump(tester, repository);

      expect(find.text(value.value), findsOneWidget);
      expect(find.text('Try again'), findsOneWidget);
    });
  }

  testWidgets('empty state distinguishes filters and can clear them', (
    tester,
  ) async {
    final repository = _Repository(results: const []);
    await _pump(
      tester,
      repository,
      criteria: const DoctorSearchCriteria(specialtyCode: 'cardiology'),
    );

    expect(find.text('No doctors found'), findsOneWidget);
    expect(find.text('Try removing one or more filters.'), findsOneWidget);
    await tester.tap(find.text('Clear filters').last);
    await tester.pumpAndSettle();
    expect(repository.criteria.last.specialtyCode, isNull);
  });

  testWidgets('filters expose only authoritative supported option groups', (
    tester,
  ) async {
    await _pump(tester, _Repository());

    await tester.tap(find.byTooltip('Filters'));
    await tester.pumpAndSettle();
    for (final label in [
      'Specialty',
      'Clinic',
      'Language',
      'Gender',
      'Minimum experience',
      'Cardiology',
      'Saxlem Clinic',
    ]) {
      expect(find.text(label), findsWidgets);
    }
    for (final unsupported in [
      'Fee',
      'Rating',
      'Distance',
      'Available now',
      'Wait time',
      'Verified',
      'Sort',
    ]) {
      expect(find.text(unsupported), findsNothing);
    }
  });

  testWidgets('search clear resets pagination criteria and keeps focus', (
    tester,
  ) async {
    final repository = _Repository();
    await _pump(tester, repository);

    await tester.enterText(find.byType(TextField), 'Shilan');
    await tester.pump(const Duration(milliseconds: 350));
    await tester.ensureVisible(find.byIcon(Icons.clear_rounded));
    await tester.tap(find.byIcon(Icons.clear_rounded));
    await tester.pumpAndSettle();

    expect(
      (tester.widget<TextField>(find.byType(TextField))).controller!.text,
      isEmpty,
    );
    expect(repository.criteria.last.query, isEmpty);
  });

  testWidgets(
    'profile reloads authoritative detail and has no booking action',
    (tester) async {
      final repository = _Repository();
      await _pump(tester, repository);

      await tester.tap(find.text('View profile'));
      await tester.pumpAndSettle();

      expect(repository.detailCalls, 1);
      expect(repository.lastDoctorId, _doctorId);
      expect(find.text('Authoritative biography'), findsOneWidget);
      expect(find.text('Neurology'), findsOneWidget);
      expect(
        find.text('Booking will be available in the next release.'),
        findsOneWidget,
      );
      expect(find.text('Book appointment'), findsNothing);
    },
  );

  testWidgets('RTL, narrow width and 200 percent text remain usable', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(640, 1100);
    tester.view.devicePixelRatio = 2;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await _pump(
      tester,
      _Repository(),
      locale: const Locale('ar'),
      textScaler: const TextScaler.linear(2),
    );

    expect(
      Directionality.of(tester.element(find.byType(DiscoverFeature))),
      TextDirection.rtl,
    );
    expect(tester.takeException(), isNull);
  });

  test(
    'production discovery presentation contains no mocks or raw metrics',
    () {
      final files = Directory('lib/features/discover/presentation')
          .listSync(recursive: true)
          .whereType<File>()
          .where((file) => file.path.endsWith('.dart'));
      final source = files.map((file) => file.readAsStringSync()).join('\n');

      expect(source, isNot(contains('MockDoctor')));
      expect(source, isNot(contains('consultationFee')));
      expect(source, isNot(contains('patientRating')));
      expect(source, isNot(contains('totalReviews')));
      expect(source, isNot(contains('distanceMeters')));
      expect(source, isNot(contains('recommendationScore')));
      for (final rawCopy in [
        'No doctors found',
        'Try removing one or more filters',
        'Doctor profile',
        'View profile',
        'Accepting new patients',
        'Apply filters',
      ]) {
        expect(source, isNot(contains("'$rawCopy'")));
      }
      expect(source, isNot(matches(RegExp(r'[ÃÂ�]|ΓÇ|┬╖'))));
    },
  );
}

Future<void> _pump(
  WidgetTester tester,
  _Repository repository, {
  bool guest = false,
  DoctorSearchCriteria? criteria,
  Locale locale = const Locale('en'),
  TextScaler textScaler = TextScaler.noScaling,
}) async {
  await tester.pumpWidget(
    MaterialApp(
      locale: locale,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      theme: AppTheme.light,
      builder: (context, child) => MediaQuery(
        data: MediaQuery.of(context).copyWith(textScaler: textScaler),
        child: child!,
      ),
      home: Scaffold(
        body: DiscoverFeature(
          repository: repository,
          initialCriteria: criteria,
          guestMode: guest,
        ),
      ),
    ),
  );
  await tester.pumpAndSettle();
}

class _Repository implements DoctorDiscoveryRepository {
  _Repository({this.failure, List<DoctorDiscoveryResult>? results})
    : results = results ?? [_doctor()];

  final DoctorDiscoveryFailureType? failure;
  final List<DoctorDiscoveryResult> results;
  final List<DoctorSearchCriteria> criteria = [];
  int optionsCalls = 0;
  int searchCalls = 0;
  int detailCalls = 0;
  String? lastDoctorId;

  @override
  Future<DoctorDiscoveryOptions> loadOptions() async {
    optionsCalls++;
    if (failure != null) throw DoctorDiscoveryFailure(failure!);
    return _options;
  }

  @override
  Future<DoctorSearchPage> search(
    DoctorSearchCriteria criteria, {
    required int page,
    int pageSize = 20,
  }) async {
    searchCalls++;
    this.criteria.add(criteria);
    return DoctorSearchPage(
      results: results,
      page: page,
      pageSize: pageSize,
      totalCount: results.length,
      totalPages: results.isEmpty ? 0 : 1,
    );
  }

  @override
  Future<DoctorDiscoveryResult> loadDoctor(String doctorId) async {
    detailCalls++;
    lastDoctorId = doctorId;
    return _doctor(detail: true);
  }
}

const _doctorId = '00000000-0000-4000-8000-000000000001';
const _clinicId = '00000000-0000-4000-8000-000000000010';

const _options = DoctorDiscoveryOptions(
  specialties: [
    DoctorSpecialtyOption(code: 'cardiology', displayName: 'Cardiology'),
  ],
  clinics: [DoctorClinicReference(id: _clinicId, name: 'Saxlem Clinic')],
  languages: ['english'],
  genders: [BackendDoctorGender.female],
  minimumExperience: 2,
  maximumExperience: 20,
);

DoctorDiscoveryResult _doctor({bool detail = false}) => DoctorDiscoveryResult(
  doctorId: _doctorId,
  doctorDisplayName: 'Dr Shilan Ahmed',
  fullName: 'Dr Shilan Ahmed',
  primarySpecialtyDisplayName: 'Cardiology',
  gender: BackendDoctorGender.female,
  status: BackendDoctorStatus.active,
  yearsOfExperience: 12,
  languages: const ['english'],
  clinics: const [DoctorClinicReference(id: _clinicId, name: 'Saxlem Clinic')],
  availability: const DoctorAvailabilityFoundation(
    status: DoctorAvailabilityStatus.available,
    acceptingNewPatients: true,
    nextAvailableAt: null,
    updatedAt: null,
  ),
  biography: detail ? 'Authoritative biography' : null,
  specialties: detail
      ? const [
          DoctorSpecialty(
            id: '00000000-0000-4000-8000-000000000020',
            code: 'neurology',
            displayName: 'Neurology',
            isPrimary: false,
          ),
        ]
      : const [],
);
