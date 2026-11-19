import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/config/theme/app_theme.dart';
import 'package:saxlem_app/core/location/geo_point.dart';
import 'package:saxlem_app/core/location/leave_by_consent.dart';
import 'package:saxlem_app/core/location/patient_locator.dart';
import 'package:saxlem_app/core/models/doctor_reference.dart';
import 'package:saxlem_app/core/models/patient_profile.dart';
import 'package:saxlem_app/core/notifications/leave_alerts.dart';
import 'package:saxlem_app/features/appointments/data/dto/departure_plan_dto.dart';
import 'package:saxlem_app/features/appointments/domain/entities/appointments_snapshot.dart';
import 'package:saxlem_app/features/appointments/domain/entities/departure_plan.dart';
import 'package:saxlem_app/features/appointments/domain/entities/patient_appointment.dart';
import 'package:saxlem_app/features/appointments/domain/repositories/patient_appointments_repository.dart';
import 'package:saxlem_app/features/appointments/presentation/leave_by/leave_by_controller.dart';
import 'package:saxlem_app/features/appointments/presentation/leave_by/leave_by_panel.dart';
import 'package:saxlem_app/features/appointments/presentation/leave_by/leave_by_services.dart';
import 'package:saxlem_app/features/home/presentation/widgets/next_visit_card.dart';
import 'package:saxlem_app/l10n/app_localizations.dart';

// Visit at 10:00 in Duhok (07:00 UTC); it's 08:00 there now.
final visitAt = DateTime.utc(2026, 11, 18, 7);
final now = DateTime.utc(2026, 11, 18, 5);
const home = GeoPoint(36.85, 42.95, accuracyMeters: 12);

PatientAppointment visit({
  DateTime? startsAt,
  PatientAppointmentStatus status = PatientAppointmentStatus.confirmed,
}) => PatientAppointment(
  id: '0190a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b',
  doctor: const DoctorReference(
    id: 'd1',
    displayName: 'Dr. Shilan',
    specialtyDisplayName: 'Cardiology',
  ),
  clinicId: 'c1',
  clinicName: 'Hillview Clinic',
  reference: 'SX-2026-000001',
  profileId: PatientProfileId.me,
  patientName: 'Avin',
  type: PatientAppointmentType.initial,
  reason: 'Check-up',
  startsAt: startsAt ?? visitAt,
  endsAt: (startsAt ?? visitAt).add(const Duration(minutes: 20)),
  status: status,
  feeIqd: 25000,
  durationMinutes: 20,
  version: 1,
);

/// 14 minutes to drive 8.2 km; arrive 10 min early, 5 to park: leave 09:31.
DeparturePlan plan({DepartureSource source = DepartureSource.traffic}) =>
    DeparturePlan(
      leaveAt: DateTime.utc(2026, 11, 18, 6, 31),
      arriveBy: DateTime.utc(2026, 11, 18, 6, 50),
      travel: const Duration(minutes: 14),
      distanceMeters: 8210,
      source: source,
      parkAndWalk: const Duration(minutes: 5),
      computedAt: now,
    );

class _Planner implements DeparturePlanner {
  _Planner([this.result]);
  DeparturePlan? result;
  AppointmentProblem? problem;
  final asked = <GeoPoint>[];
  final onTheWayFrom = <GeoPoint>[];
  @override
  Future<DeparturePlan> departure(String appointmentId, GeoPoint from) async {
    asked.add(from);
    if (problem case final problem?) throw AppointmentFailure(problem);
    return result ?? plan();
  }

  @override
  Future<OnTheWay> onTheWay(String appointmentId, GeoPoint from) async {
    onTheWayFrom.add(from);
    if (problem case final problem?) throw AppointmentFailure(problem);
    return OnTheWay(
      onTheWayAt: now,
      arrivalEta: DateTime.utc(2026, 11, 18, 6, 47),
      travel: const Duration(minutes: 16),
      distanceMeters: 8210,
      source: DepartureSource.learned,
    );
  }
}

class _Locator implements PatientLocator {
  GeoPoint point = home;
  LocationProblem? problem;
  final asks = <bool>[];
  final opened = <LocationProblem>[];
  @override
  Future<GeoPoint> current({required bool ask}) async {
    asks.add(ask);
    if (problem case final problem?) throw LocationFailure(problem);
    return point;
  }

  @override
  Future<void> openSettings(LocationProblem problem) async =>
      opened.add(problem);
}

class _Alerts implements LeaveAlerts {
  var asked = 0;
  final scheduled = <LeaveAlert>[];
  final cancelled = <String>[];
  final kept = <Set<String>>[];
  @override
  Future<void> ask() async => asked++;
  @override
  Future<void> schedule(LeaveAlert alert) async => scheduled.add(alert);
  @override
  Future<void> cancel(String appointmentId) async =>
      cancelled.add(appointmentId);
  @override
  Future<void> keepOnly(String profileId, Set<String> appointmentIds) async =>
      kept.add(appointmentIds);
}

class _Consent implements LeaveByConsent {
  _Consent([this.value = false]);
  bool value;
  @override
  Future<bool> given() async => value;
  @override
  Future<void> give() async => value = true;
  @override
  Future<void> withdraw() async => value = false;
}

LeaveAlert _alertFor(DeparturePlan plan, DateTime at) => LeaveAlert(
  appointmentId: visit().id,
  profileId: 'me',
  at: at,
  title: 'Time to get ready',
  body: 'Leave by',
  channelName: 'Time to leave',
);

Widget _app(Widget child, {Locale locale = const Locale('en')}) => MaterialApp(
  theme: AppTheme.light,
  locale: locale,
  supportedLocales: AppLocalizations.supportedLocales,
  localizationsDelegates: AppLocalizations.localizationsDelegates,
  home: Scaffold(body: SingleChildScrollView(child: child)),
);

void main() {
  setUp(LeaveByController.forgetRecent);

  group('reading the server\'s plan', () {
    Map<String, dynamic> body() => {
      'leaveAt': '2026-11-18T06:31:00.000Z',
      'arriveBy': '2026-11-18T06:50:00.000Z',
      'travelSeconds': 840,
      'distanceMeters': 8210,
      'source': 'traffic',
      'parkAndWalkMinutes': 5,
      'computedAt': '2026-11-18T05:00:00.000Z',
    };

    test('accepts a consistent plan', () {
      final parsed = DeparturePlanDto.parse(body());
      expect(parsed.leaveAt, DateTime.utc(2026, 11, 18, 6, 31));
      expect(parsed.travelMinutes, 14);
      expect(parsed.source, DepartureSource.traffic);
    });

    test('reads "learned" times and the on-the-way answer', () {
      expect(
        DeparturePlanDto.parse({...body(), 'source': 'learned'}).source,
        DepartureSource.learned,
      );
      final trip = DeparturePlanDto.parseOnTheWay({
        'onTheWayAt': '2026-11-18T06:25:00.000Z',
        'arrivalEta': '2026-11-18T06:47:00.000Z',
        'travelSeconds': 1020,
        'distanceMeters': 8210,
        'source': 'roads',
      });
      expect(trip.arrivalEta, DateTime.utc(2026, 11, 18, 6, 47));
      expect(
        () => DeparturePlanDto.parseOnTheWay({
          'onTheWayAt': '2026-11-18T06:25:00.000Z',
          'arrivalEta': '2026-11-18T06:20:00.000Z',
          'travelSeconds': 1020,
          'distanceMeters': 8210,
          'source': 'roads',
        }),
        throwsFormatException,
      );
    });

    test(
      'refuses extra fields, unknown sources and sums that don\'t add up',
      () {
        expect(
          () => DeparturePlanDto.parse({...body(), 'origin': '36.8,42.9'}),
          throwsFormatException,
        );
        expect(
          () => DeparturePlanDto.parse({...body(), 'source': 'guess'}),
          throwsFormatException,
        );
        expect(
          () => DeparturePlanDto.parse({...body(), 'travelSeconds': 60}),
          throwsFormatException,
        );
      },
    );
  });

  group('when to leave', () {
    late _Planner planner;
    late _Locator locator;
    late _Alerts alerts;
    late _Consent consent;
    LeaveByController controller({
      PatientAppointment? appointment,
      DateTime? at,
    }) => LeaveByController(
      appointment: appointment ?? visit(),
      planner: planner,
      services: LeaveByServices(
        locator: locator,
        alerts: alerts,
        consent: consent,
      ),
      alertFor: _alertFor,
      now: () => at ?? now,
    );

    setUp(() {
      planner = _Planner();
      locator = _Locator();
      alerts = _Alerts();
      consent = _Consent();
    });

    test(
      'asks first, and reads the location only after "Use my location"',
      () async {
        final leave = controller();
        await leave.start();
        expect(leave.state, isA<LeaveByAsk>());
        expect(locator.asks, isEmpty);

        await leave.enable();
        expect(consent.value, isTrue);
        expect(alerts.asked, 1);
        expect(locator.asks, [true]);
        expect((leave.state as LeaveByReady).plan.leaveAt, plan().leaveAt);
        // Alert 10 minutes before it's time to leave.
        expect(alerts.scheduled.single.at, DateTime.utc(2026, 11, 18, 6, 21));
        leave.dispose();
      },
    );

    test('once turned on, works it out on open without asking again', () async {
      consent.value = true;
      final first = controller();
      await first.start();
      expect(first.state, isA<LeaveByReady>());
      expect(locator.asks, [false]);
      first.dispose();

      // Home and the visit page share one answer for the same trip.
      final second = controller();
      await second.start();
      expect(planner.asked, hasLength(1));
      second.dispose();

      // Moving more than 300 m asks for a fresh route.
      locator.point = const GeoPoint(36.87, 42.99);
      final third = controller();
      await third.start();
      expect(planner.asked, hasLength(2));
      third.dispose();
    });

    test('stays out of the way when the visit is not within a day', () async {
      consent.value = true;
      final later = controller(
        appointment: visit(startsAt: visitAt.add(const Duration(days: 2))),
      );
      await later.start();
      expect(later.state, isA<LeaveByHidden>());
      expect(locator.asks, isEmpty);
      // A visit moved further out must not keep its old alert.
      expect(alerts.cancelled, [visit().id]);

      final cancelled = controller(
        appointment: visit(status: PatientAppointmentStatus.cancelled),
      );
      await cancelled.start();
      expect(cancelled.state, isA<LeaveByHidden>());
      expect(alerts.cancelled, hasLength(2));
      later.dispose();
      cancelled.dispose();
    });

    test('explains a switched-off or refused location', () async {
      consent.value = true;
      locator.problem = LocationProblem.serviceOff;
      final leave = controller();
      await leave.start();
      expect(
        (leave.state as LeaveByBlocked).problem,
        LocationProblem.serviceOff,
      );
      await leave.openSettings();
      expect(locator.opened, [LocationProblem.serviceOff]);

      locator.problem = LocationProblem.denied;
      await leave.refresh();
      expect(leave.state, isA<LeaveByAsk>());
      leave.dispose();
    });

    test('hides itself when the clinic has no map pin', () async {
      consent.value = true;
      planner.problem = AppointmentProblem.conflict;
      final leave = controller();
      await leave.start();
      expect(leave.state, isA<LeaveByHidden>());
      planner.problem = AppointmentProblem.offline;
      await leave.refresh();
      expect(leave.state, isA<LeaveByFailed>());
      leave.dispose();
    });

    test('alerts at the leave time when 10 minutes ahead has passed', () async {
      consent.value = true;
      final close = controller(at: DateTime.utc(2026, 11, 18, 6, 25));
      await close.start();
      expect(alerts.scheduled.single.at, plan().leaveAt);
      close.dispose();

      LeaveByController.forgetRecent();
      final late = controller(at: DateTime.utc(2026, 11, 18, 6, 40));
      await late.start();
      expect(alerts.scheduled, hasLength(1));
      expect(alerts.cancelled, [visit().id]);
      late.dispose();
    });

    test('"I\'m on my way" tells the clinic and drops the alert', () async {
      consent.value = true;
      final early = controller();
      await early.start();
      // Too early to be setting off: not offered yet.
      expect(early.canSayOnMyWay(plan()), isFalse);
      early.dispose();

      final leaving = controller(at: DateTime.utc(2026, 11, 18, 6, 20));
      await leaving.start();
      final ready = leaving.state as LeaveByReady;
      expect(leaving.canSayOnMyWay(ready.plan), isTrue);
      await leaving.onMyWay();
      expect(planner.onTheWayFrom, [home]);
      expect(
        (leaving.state as LeaveByOnTheWay).arrivalEta,
        DateTime.utc(2026, 11, 18, 6, 47),
      );
      expect(alerts.cancelled, contains(visit().id));
      leaving.dispose();
    });

    test(
      'a visit already on the way shows that, without reading location',
      () async {
        final leave = LeaveByController(
          appointment: PatientAppointment(
            id: visit().id,
            doctor: visit().doctor,
            clinicId: 'c1',
            clinicName: 'Hillview Clinic',
            reference: 'SX-2026-000001',
            profileId: PatientProfileId.me,
            patientName: 'Avin',
            type: PatientAppointmentType.initial,
            reason: 'Check-up',
            startsAt: visitAt,
            endsAt: visitAt.add(const Duration(minutes: 20)),
            status: PatientAppointmentStatus.confirmed,
            feeIqd: 25000,
            durationMinutes: 20,
            version: 1,
            onTheWayEta: DateTime.utc(2026, 11, 18, 6, 47),
          ),
          planner: planner,
          services: LeaveByServices(
            locator: locator,
            alerts: alerts,
            consent: consent,
          ),
          alertFor: _alertFor,
          now: () => now,
        );
        await leave.start();
        expect(leave.state, isA<LeaveByOnTheWay>());
        expect(locator.asks, isEmpty);
        leave.dispose();
      },
    );

    test('a failed "on my way" keeps the plan and says so', () async {
      consent.value = true;
      final leaving = controller(at: DateTime.utc(2026, 11, 18, 6, 20));
      await leaving.start();
      planner.problem = AppointmentProblem.offline;
      await leaving.onMyWay();
      expect(leaving.state, isA<LeaveByReady>());
      expect(leaving.onMyWayFailed, isTrue);
      leaving.dispose();
    });

    test('"Stop using my location" forgets it and drops the alert', () async {
      consent.value = true;
      final leave = controller();
      await leave.start();
      await leave.disable();
      expect(consent.value, isFalse);
      expect(alerts.cancelled, [visit().id]);
      expect(leave.state, isA<LeaveByAsk>());
      leave.dispose();
    });
  });

  group('on screen', () {
    LeaveByServices services({bool consent = true, _Locator? locator}) =>
        LeaveByServices(
          locator: locator ?? _Locator(),
          alerts: _Alerts(),
          consent: _Consent(consent),
        );

    testWidgets('the visit page shows the leave time, drive and check-in', (
      tester,
    ) async {
      await tester.pumpWidget(
        _app(
          LeaveByPanel(
            appointment: visit(),
            planner: _Planner(),
            services: services(),
            now: () => now,
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('Leave by 09:31'), findsOneWidget);
      expect(find.text('14 min drive · 8.2 km · with traffic'), findsOneWidget);
      expect(find.text('Be at reception by 09:50 to check in'), findsOneWidget);
      expect(find.text('Stop using my location'), findsOneWidget);
    });

    testWidgets('counts down near the time and warns when it has passed', (
      tester,
    ) async {
      var at = DateTime.utc(2026, 11, 18, 6, 25);
      await tester.pumpWidget(
        _app(
          LeaveByPanel(
            appointment: visit(),
            planner: _Planner(plan(source: DepartureSource.estimate)),
            services: services(),
            now: () => at,
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('Leave in 6 min'), findsOneWidget);
      expect(
        find.text('14 min drive · 8.2 km · estimate from distance'),
        findsOneWidget,
      );
      at = DateTime.utc(2026, 11, 18, 6, 36);
      await tester.pump(const Duration(seconds: 30));
      expect(find.text('You may be late. Leave now'), findsOneWidget);
    });

    testWidgets('asks before using the location, in the patient\'s language', (
      tester,
    ) async {
      final locator = _Locator();
      await tester.pumpWidget(
        _app(
          LeaveByPanel(
            appointment: visit(),
            planner: _Planner(),
            services: services(consent: false, locator: locator),
            now: () => now,
          ),
          locale: const Locale('ar'),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('متى أنطلق؟'), findsOneWidget);
      expect(locator.asks, isEmpty);
      await tester.tap(find.text('استخدم موقعي'));
      await tester.pumpAndSettle();
      expect(locator.asks, [true]);
      expect(find.text('انطلق قبل 09:31'), findsOneWidget);
    });

    testWidgets('near the time, "I\'m on my way" lets reception know', (
      tester,
    ) async {
      final planner = _Planner();
      await tester.pumpWidget(
        _app(
          LeaveByPanel(
            appointment: visit(),
            planner: planner,
            services: services(),
            now: () => DateTime.utc(2026, 11, 18, 6, 20),
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(
        find.text(
          'Lets the clinic know when to expect you. Your location isn\'t shared.',
        ),
        findsOneWidget,
      );
      await tester.tap(find.text("I'm on my way"));
      await tester.pumpAndSettle();
      expect(find.text('On your way'), findsOneWidget);
      expect(
        find.text('The clinic expects you at about 09:47'),
        findsOneWidget,
      );
      expect(planner.onTheWayFrom, hasLength(1));
    });

    testWidgets('Home\'s next visit card carries the leave time', (
      tester,
    ) async {
      final repo = _HomeRepo([visit()]);
      final alerts = _Alerts();
      await tester.pumpWidget(
        _app(
          NextVisitCard(
            repository: repo,
            profileId: PatientProfileId.me,
            onOpen: () {},
            now: () => now,
            leaveByServices: LeaveByServices(
              locator: _Locator(),
              alerts: alerts,
              consent: _Consent(true),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('Leave by 09:31 · 14 min drive'), findsOneWidget);
      // Alerts for visits no longer coming up are dropped.
      expect(alerts.kept.single, {visit().id});
    });
  });
}

class _HomeRepo extends _Planner implements PatientAppointmentsRepository {
  _HomeRepo(this.items);
  final List<PatientAppointment> items;
  @override
  Future<AppointmentPage> list(AppointmentListRequest request) async =>
      AppointmentPage(
        items: items.where((i) => i.status == request.status).toList(),
        nextCursor: null,
      );
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
