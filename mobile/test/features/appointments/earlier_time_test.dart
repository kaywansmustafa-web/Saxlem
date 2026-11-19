import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/config/theme/app_theme.dart';
import 'package:saxlem_app/core/models/doctor_reference.dart';
import 'package:saxlem_app/core/models/patient_profile.dart';
import 'package:saxlem_app/features/appointments/domain/entities/patient_appointment.dart';
import 'package:saxlem_app/features/appointments/domain/repositories/patient_appointments_repository.dart';
import 'package:saxlem_app/features/appointments/presentation/widgets/earlier_time_card.dart';
import 'package:saxlem_app/features/booking/domain/entities/appointment_slot.dart';
import 'package:saxlem_app/l10n/app_localizations.dart';

final now = DateTime.utc(2026, 11, 19, 5);
PatientAppointment _visit(DateTime startsAt) => PatientAppointment(
  id: '0190a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b',
  doctor: const DoctorReference(
    id: 'd1',
    displayName: 'Dr. Shilan',
    specialtyDisplayName: 'Cardiology',
  ),
  clinicId: 'c1',
  clinicName: 'Hillview',
  reference: 'SX-2026-000001',
  profileId: PatientProfileId.me,
  patientName: 'Avin',
  type: PatientAppointmentType.initial,
  reason: 'Check-up',
  startsAt: startsAt,
  endsAt: startsAt.add(const Duration(minutes: 30)),
  status: PatientAppointmentStatus.confirmed,
  feeIqd: 25000,
  durationMinutes: 30,
  version: 1,
);

class _Source implements EarlierTimeSource {
  _Source(this.status);
  EarlierTimeStatus status;
  final asks = <bool>[];
  @override
  Future<EarlierTimeStatus> earlierTime(String appointmentId) async => status;
  @override
  Future<EarlierTimeStatus> watchEarlierTime(
    String appointmentId, {
    required bool watch,
  }) async {
    asks.add(watch);
    return status = EarlierTimeStatus(watching: watch, offer: status.offer);
  }
}

Widget _app(Widget child) => MaterialApp(
  theme: AppTheme.light,
  supportedLocales: AppLocalizations.supportedLocales,
  localizationsDelegates: AppLocalizations.localizationsDelegates,
  home: Scaffold(body: SingleChildScrollView(child: child)),
);

void main() {
  testWidgets('a patient asks to hear about an earlier time', (tester) async {
    final source = _Source(const EarlierTimeStatus(watching: false));
    await tester.pumpWidget(
      _app(
        EarlierTimeCard(
          appointment: _visit(DateTime.utc(2026, 11, 21, 7)),
          source: source,
          onMove: (_) async {},
          now: () => now,
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Tell me if an earlier time opens'), findsOneWidget);
    await tester.tap(find.byType(Switch));
    await tester.pumpAndSettle();
    expect(source.asks, [true]);
  });

  testWidgets('an earlier time found is one tap away', (tester) async {
    final slot = AppointmentSlot(
      startsAt: DateTime.utc(2026, 11, 20, 6),
      endsAt: DateTime.utc(2026, 11, 20, 6, 30),
      durationMinutes: 30,
    );
    AppointmentSlot? moved;
    await tester.pumpWidget(
      _app(
        EarlierTimeCard(
          appointment: _visit(DateTime.utc(2026, 11, 21, 7)),
          source: _Source(EarlierTimeStatus(watching: true, offer: slot)),
          onMove: (value) async => moved = value,
          now: () => now,
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('An earlier time is free'), findsOneWidget);
    expect(find.textContaining('09:00'), findsOneWidget);
    await tester.tap(find.text('Move my visit to this time'));
    expect(moved, slot);
  });

  testWidgets('not offered for a visit only hours away', (tester) async {
    await tester.pumpWidget(
      _app(
        EarlierTimeCard(
          appointment: _visit(now.add(const Duration(hours: 2))),
          source: _Source(const EarlierTimeStatus(watching: false)),
          onMove: (_) async {},
          now: () => now,
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Tell me if an earlier time opens'), findsNothing);
  });
}
