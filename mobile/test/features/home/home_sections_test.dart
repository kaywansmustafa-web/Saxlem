import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/config/theme/app_theme.dart';
import 'package:saxlem_app/core/models/doctor_reference.dart';
import 'package:saxlem_app/core/models/patient_profile.dart';
import 'package:saxlem_app/features/appointments/domain/entities/appointments_snapshot.dart';
import 'package:saxlem_app/features/appointments/domain/entities/patient_appointment.dart';
import 'package:saxlem_app/features/appointments/domain/repositories/patient_appointments_repository.dart';
import 'package:saxlem_app/features/discover/domain/entities/doctor_discovery_options.dart';
import 'package:saxlem_app/features/discover/domain/entities/doctor_discovery_result.dart';
import 'package:saxlem_app/features/discover/domain/entities/doctor_search_criteria.dart';
import 'package:saxlem_app/features/discover/domain/entities/doctor_search_page.dart';
import 'package:saxlem_app/features/discover/domain/repositories/doctor_discovery_repository.dart';
import 'package:saxlem_app/features/home/presentation/widgets/home_discovery_sections.dart';
import 'package:saxlem_app/features/home/presentation/widgets/next_visit_card.dart';
import 'package:saxlem_app/features/live_queue/domain/entities/patient_queue_status.dart';
import 'package:saxlem_app/features/live_queue/domain/repositories/live_queue_repository.dart';
import 'package:saxlem_app/l10n/app_localizations.dart';

Widget _app(Widget child) => MaterialApp(
  theme: AppTheme.light,
  localizationsDelegates: const [
    ...AppLocalizations.localizationsDelegates,
    GlobalWidgetsLocalizations.delegate,
  ],
  supportedLocales: AppLocalizations.supportedLocales,
  home: Scaffold(body: SingleChildScrollView(child: child)),
);

class _Directory implements DoctorDiscoveryRepository {
  _Directory(this.codes, {this.doctors = const []});
  final List<String> codes;
  final List<DoctorDiscoveryResult> doctors;
  @override
  Future<DoctorDiscoveryOptions> loadOptions() async => DoctorDiscoveryOptions(
    specialties: [
      for (final code in codes)
        DoctorSpecialtyOption(code: code, displayName: code),
    ],
    clinics: const [],
    languages: const [],
    genders: const [],
    minimumExperience: null,
    maximumExperience: null,
  );
  @override
  Future<DoctorSearchPage> search(
    DoctorSearchCriteria criteria, {
    required int page,
    int pageSize = 20,
  }) async => DoctorSearchPage(
    results: doctors,
    page: 1,
    pageSize: pageSize,
    totalCount: doctors.length,
    totalPages: 1,
  );
  @override
  Future<DoctorDiscoveryResult> loadDoctor(String doctorId) =>
      throw UnimplementedError();
}

DoctorDiscoveryResult _doctor(String name, DateTime? next) =>
    DoctorDiscoveryResult(
      doctorId: name,
      doctorDisplayName: name,
      fullName: name,
      primarySpecialtyDisplayName: 'Dentistry',
      gender: BackendDoctorGender.female,
      status: BackendDoctorStatus.active,
      yearsOfExperience: 5,
      languages: const [],
      clinics: const [DoctorClinicReference(id: 'c', name: 'Clinic')],
      availability: DoctorAvailabilityFoundation(
        status: DoctorAvailabilityStatus.available,
        acceptingNewPatients: true,
        nextAvailableAt: next,
        updatedAt: null,
      ),
      fees: const DoctorFees(firstVisitIqd: 25000, followUpIqd: 15000),
    );

void main() {
  testWidgets('symptoms lead only to specialties that have doctors', (
    tester,
  ) async {
    DoctorSearchCriteria? opened;
    await tester.pumpWidget(
      _app(
        HomeDiscoverySections(
          repository: _Directory(['dentistry', 'pediatrics']),
          onOpenDiscover: ({criteria}) => opened = criteria,
          onOpenDoctor: (_) {},
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Tooth pain'), findsOneWidget);
    expect(find.text('My child is sick'), findsOneWidget);
    // "dentistry" contains "ent" but is not ear, nose and throat.
    expect(find.text('Ear, nose, throat'), findsNothing);
    expect(find.text('Heart and blood pressure'), findsNothing);
    await tester.tap(find.text('Tooth pain'));
    expect(opened?.specialtyCode, 'dentistry');
  });

  testWidgets('shows doctors with a free time left today, earliest first', (
    tester,
  ) async {
    final now = DateTime.now();
    String? doctor;
    await tester.pumpWidget(
      _app(
        HomeDiscoverySections(
          repository: _Directory(
            ['dentistry'],
            doctors: [
              _doctor('Dr. Later', now.add(const Duration(days: 3))),
              _doctor('Dr. Today', now.add(const Duration(minutes: 30))),
              _doctor('Dr. None', null),
            ],
          ),
          onOpenDiscover: ({criteria}) {},
          onOpenDoctor: (id) => doctor = id,
        ),
      ),
    );
    await tester.pumpAndSettle();
    if (now.add(const Duration(minutes: 30)).day == now.day) {
      expect(find.text('Dr. Today'), findsOneWidget);
      await tester.tap(find.text('Dr. Today'));
      expect(doctor, 'Dr. Today');
    }
    expect(find.text('Dr. Later'), findsNothing);
    expect(find.text('Dr. None'), findsNothing);
  });

  testWidgets(
    'on the day, the next visit follows the live queue and opens it',
    (tester) async {
      // 10:00 in Duhok, so the visit is the same day wherever the test runs.
      final now = DateTime.utc(2026, 11, 18, 7);
      final starts = now.add(const Duration(minutes: 40));
      var found = false;
      (String, bool)? opened;
      await tester.pumpWidget(
        _app(
          NextVisitCard(
            repository: _Visits(starts),
            profileId: PatientProfileId.me,
            onOpen: () {},
            onOpenVisit: (id, {required inQueue}) => opened = (id, inQueue),
            liveQueue: _Queue(),
            onFound: () => found = true,
            now: () => now,
          ),
        ),
      );
      await tester.pump();
      await tester.pump();
      await tester.pump();
      expect(found, isTrue);
      expect(
        find.textContaining('Ticket 7 · 3 people ahead of you'),
        findsOneWidget,
      );
      await tester.tap(find.text('Dr. Shilan'));
      expect(opened, ('a1', true));
      // The card keeps polling; stop the timer before the test ends.
      await tester.pumpWidget(const SizedBox());
    },
  );
}

class _Visits implements PatientAppointmentsRepository {
  _Visits(this.starts);
  final DateTime starts;
  @override
  Future<AppointmentPage> list(AppointmentListRequest request) async =>
      AppointmentPage(
        items: [
          if (request.status == PatientAppointmentStatus.confirmed)
            PatientAppointment(
              id: 'a1',
              reference: 'SX-1',
              doctor: const DoctorReference(
                id: 'd1',
                displayName: 'Dr. Shilan',
                specialtyDisplayName: 'Cardiology',
              ),
              clinicId: 'c',
              clinicName: 'Riverside Clinic',
              profileId: PatientProfileId.me,
              patientName: 'Avin',
              type: PatientAppointmentType.initial,
              reason: 'Check-up',
              startsAt: starts,
              endsAt: starts.add(const Duration(minutes: 15)),
              status: PatientAppointmentStatus.confirmed,
              feeIqd: 25000,
              durationMinutes: 15,
              version: 1,
            ),
        ],
        nextCursor: null,
      );
  @override
  noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _Queue implements LiveQueueRepository {
  @override
  Future<PatientQueueStatus> getQueueStatus(String appointmentId) async =>
      PatientQueueStatus(
        appointmentId: appointmentId,
        queueState: QueueState.open,
        patientsAhead: 3,
        instruction: '',
        estimateSuspended: true,
        doctor: const QueueReference('d1', 'Dr. Shilan'),
        clinic: const QueueReference('c', 'Riverside Clinic'),
        appointmentReference: 'SX-1',
        patientEntryStatus: PatientEntryStatus.waiting,
        updatedAt: DateTime.now(),
        ticketNumber: 7,
      );
}
