import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/config/theme/app_theme.dart';
import 'package:saxlem_app/core/models/doctor_reference.dart';
import 'package:saxlem_app/core/models/patient_profile.dart';
import 'package:saxlem_app/features/appointments/domain/entities/appointments_snapshot.dart';
import 'package:saxlem_app/features/appointments/domain/entities/patient_appointment.dart';
import 'package:saxlem_app/features/appointments/domain/repositories/patient_appointments_repository.dart';
import 'package:saxlem_app/features/home/presentation/widgets/next_visit_card.dart';
import 'package:saxlem_app/l10n/app_localizations.dart';

class _Repo implements PatientAppointmentsRepository {
  _Repo(this.items);
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

PatientAppointment _visit(
  String doctor,
  DateTime startsAt, [
  PatientAppointmentStatus status = PatientAppointmentStatus.scheduled,
]) => PatientAppointment(
  id: doctor,
  doctor: DoctorReference(
    id: 'd-$doctor',
    displayName: doctor,
    specialtyDisplayName: 'Cardiology',
  ),
  clinicId: 'c1',
  clinicName: 'Hillview Clinic',
  reference: 'SX-1',
  profileId: PatientProfileId.me,
  patientName: 'Avin',
  type: PatientAppointmentType.initial,
  reason: 'Check-up',
  startsAt: startsAt,
  endsAt: startsAt.add(const Duration(minutes: 30)),
  status: status,
  feeIqd: 25000,
  durationMinutes: 30,
  version: 1,
);

void main() {
  testWidgets('shows the nearest booked visit with a plain "Today" and time', (
    tester,
  ) async {
    final now = DateTime.utc(2026, 11, 18, 7); // 10:00 in Baghdad
    var opened = false;
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        supportedLocales: AppLocalizations.supportedLocales,
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        home: Scaffold(
          body: NextVisitCard(
            repository: _Repo([
              _visit('Dr. Later', DateTime.utc(2026, 11, 20, 9)),
              _visit(
                'Dr. Soon',
                DateTime.utc(2026, 11, 18, 10, 30),
                PatientAppointmentStatus.confirmed,
              ),
            ]),
            profileId: PatientProfileId.me,
            onOpen: () => opened = true,
            now: () => now,
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Dr. Soon'), findsOneWidget);
    // Design A data label: upper-case in English.
    expect(find.text('YOUR NEXT VISIT · TODAY'), findsOneWidget);
    expect(find.text('13:30'), findsOneWidget);
    await tester.tap(find.text('Dr. Soon'));
    expect(opened, isTrue);
  });

  testWidgets('stays out of the way when nothing is booked', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        supportedLocales: AppLocalizations.supportedLocales,
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        home: Scaffold(
          body: NextVisitCard(
            repository: _Repo([]),
            profileId: PatientProfileId.me,
            onOpen: () {},
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.byType(InkWell), findsNothing);
  });
}
