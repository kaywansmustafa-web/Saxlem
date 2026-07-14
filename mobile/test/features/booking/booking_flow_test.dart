import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/config/theme/app_theme.dart';
import 'package:saxlem_app/features/booking/booking_feature.dart';
import 'package:saxlem_app/features/booking/domain/entities/booking_doctor_reference.dart';

void main() {
  const doctor = BookingDoctorReference(
    id: 'demo',
    displayName: 'Dr. Demo',
    specialtyDisplayName: 'Dentistry',
  );
  testWidgets('completes booking and shows View Doctor and Return Home', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        home: const BookingFeature(doctor: doctor),
      ),
    );
    await tester.pump(const Duration(milliseconds: 400));
    await tester.tap(find.text('Saxlem Demo Medical Center'));
    await tester.pump(const Duration(milliseconds: 400));
    await tester.tap(find.text('Available').first);
    await tester.pump();
    await tester.tap(find.text('09:00').first);
    await tester.pump();
    expect(find.text('Review appointment'), findsOneWidget);
    await tester.tap(find.text('Confirm appointment'));
    await tester.pump(const Duration(milliseconds: 700));
    expect(find.text('Appointment confirmed'), findsOneWidget);
    expect(find.text('View Doctor'), findsOneWidget);
    expect(find.text('Return Home'), findsOneWidget);
  });
  testWidgets('renders booking in RTL at 200 percent text', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        home: Directionality(
          textDirection: TextDirection.rtl,
          child: MediaQuery(
            data: const MediaQueryData(textScaler: TextScaler.linear(2)),
            child: const BookingFeature(doctor: doctor),
          ),
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 400));
    expect(tester.takeException(), isNull);
    expect(find.text('Choose a clinic'), findsOneWidget);
  });
}
