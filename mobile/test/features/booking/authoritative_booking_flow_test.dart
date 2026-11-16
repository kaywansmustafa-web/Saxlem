import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/config/theme/app_theme.dart';
import 'package:saxlem_app/core/models/patient_profile.dart';
import 'package:saxlem_app/features/booking/booking_feature.dart';
import 'package:saxlem_app/features/booking/domain/entities/appointment_slot.dart';
import 'package:saxlem_app/features/booking/domain/entities/booking_availability.dart';
import 'package:saxlem_app/features/booking/domain/entities/booking_clinic_option.dart';
import 'package:saxlem_app/features/booking/domain/entities/booking_confirmation.dart';
import 'package:saxlem_app/features/booking/domain/entities/booking_doctor_reference.dart';
import 'package:saxlem_app/features/booking/domain/entities/booking_draft.dart';
import 'package:saxlem_app/features/booking/domain/entities/booking_types.dart';
import 'package:saxlem_app/features/booking/domain/repositories/booking_repository.dart';
import 'package:saxlem_app/features/family_profiles/data/repositories/in_memory_patient_profiles_repository.dart';
import 'package:saxlem_app/features/family_profiles/presentation/controllers/patient_profiles_controller.dart';
import 'package:saxlem_app/features/payments/domain/appointment_payment.dart';
import 'package:saxlem_app/features/payments/domain/payments_repository.dart';
import 'package:saxlem_app/features/payments/payments_scope.dart';
import 'package:saxlem_app/l10n/app_localizations.dart';

void main() {
  testWidgets('completes authoritative booking and shows public reference', (
    tester,
  ) async {
    final repository = _BookingRepository();
    final profiles = _profiles();
    await profiles.load();
    await tester.pumpWidget(_app(repository, profiles));
    await tester.pumpAndSettle();

    await tester.tap(find.byType(DropdownButtonFormField<BookingClinicOption>));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Saxlem Clinic').last);
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextFormField), 'Consultation');
    await tester.tap(find.text('Check availability'));
    await tester.pumpAndSettle();

    expect(find.text('09:00'), findsOneWidget);
    await tester.tap(find.text('09:00'));
    await tester.pumpAndSettle();
    expect(find.text('Review appointment'), findsOneWidget);
    expect(find.text('35,000 IQD'), findsOneWidget);

    expect(find.text('Pay at the clinic'), findsOneWidget);
    expect(find.text('Pay now in the app'), findsNothing);
    await tester.ensureVisible(find.text('Confirm appointment'));
    await tester.tap(find.text('Confirm appointment'));
    await tester.pumpAndSettle();
    expect(repository.createCalls, 1);
    expect(find.text('Appointment confirmed'), findsOneWidget);
    expect(find.textContaining('SX-2030-000001'), findsOneWidget);
    expect(find.text('View Doctor'), findsOneWidget);
    expect(find.text('Return Home'), findsOneWidget);
    expect(find.text('Go to My Appointments'), findsNothing);
  });

  testWidgets('pays online in the app right after booking', (tester) async {
    final repository = _BookingRepository();
    final payments = _Payments();
    final profiles = _profiles();
    await profiles.load();
    await tester.pumpWidget(_app(repository, profiles, payments: payments));
    await tester.pumpAndSettle();
    await tester.tap(find.byType(DropdownButtonFormField<BookingClinicOption>));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Saxlem Clinic').last);
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextFormField), 'Consultation');
    await tester.tap(find.text('Check availability'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('09:00'));
    await tester.pumpAndSettle();

    // The clinic takes online payment, so it is offered first and preselected.
    expect(find.text('Pay now in the app'), findsOneWidget);
    expect(find.text('Pay at the clinic'), findsOneWidget);
    await tester.ensureVisible(find.text('Confirm and pay'));
    await tester.tap(find.text('Confirm and pay'));
    // The waiting screen animates continuously, so pump fixed frames.
    for (var i = 0; i < 10; i++) {
      await tester.pump(const Duration(milliseconds: 100));
    }

    expect(repository.createCalls, 1);
    expect(payments.chosen, [PaymentMethod.online]);
    expect(find.text('Waiting for your payment…'), findsOneWidget);
    expect(find.text('Open FIB to pay'), findsOneWidget);

    payments.paid = true;
    await tester.pump(const Duration(seconds: 4));
    for (var i = 0; i < 10; i++) {
      await tester.pump(const Duration(milliseconds: 100));
    }
    await tester.pumpAndSettle();
    expect(find.text('Payment received'), findsOneWidget);
    await tester.tap(find.text('OK'));
    await tester.pumpAndSettle();
    expect(find.text('Appointment confirmed'), findsOneWidget);
    expect(find.text('Paid'), findsOneWidget);
    expect(find.text('Pay now'), findsNothing);
  });

  testWidgets('booking setup supports RTL at 200 percent text', (tester) async {
    final profiles = _profiles();
    await profiles.load();
    await tester.pumpWidget(
      MediaQuery(
        data: const MediaQueryData(textScaler: TextScaler.linear(2)),
        child: _app(_BookingRepository(), profiles, locale: const Locale('ar')),
      ),
    );
    await tester.pumpAndSettle();
    expect(
      Directionality.of(tester.element(find.byType(BookingFeature))),
      TextDirection.rtl,
    );
    expect(tester.takeException(), isNull);
  });
}

PatientProfilesController _profiles() => PatientProfilesController(
  InMemoryPatientProfilesRepository(
    profiles: [
      PatientProfile(
        id: const PatientProfileId(profileId),
        relationship: PatientRelationship.me,
        firstName: 'Patient',
        lastName: 'One',
        gender: PatientGender.unspecified,
        dateOfBirth: DateTime(1990),
        authoritative: true,
      ),
    ],
  ),
  guest: false,
);

Widget _app(
  BookingRepository repository,
  PatientProfilesController profiles, {
  Locale locale = const Locale('en'),
  PaymentsRepository payments = const UnavailablePaymentsRepository(),
}) => PaymentsScope(
  repository: payments,
  child: MaterialApp(
    theme: AppTheme.light,
    locale: locale,
    supportedLocales: AppLocalizations.supportedLocales,
    localizationsDelegates: AppLocalizations.localizationsDelegates,
    home: BookingFeature(
      doctor: doctor,
      repository: repository,
      profilesController: profiles,
    ),
  ),
);

class _Payments implements PaymentsRepository {
  final chosen = <PaymentMethod>[];
  bool paid = false;

  AppointmentPayment _payment(PaymentMethod method) => AppointmentPayment(
    appointmentId: confirmation.appointmentId,
    method: method,
    status: method == PaymentMethod.counter
        ? PaymentStatus.dueAtCounter
        : paid
        ? PaymentStatus.paid
        : PaymentStatus.pending,
    amountIqd: 35000,
    provider: 'fib',
    onlineAvailable: true,
    online: paid || method == PaymentMethod.counter
        ? null
        : OnlinePaymentDetails(
            readableCode: 'AB12-CD34',
            qrCode: null,
            personalAppLink: Uri.parse('https://personal.fib.iq/pay'),
            businessAppLink: null,
            validUntil: DateTime.utc(2030, 8, 1),
          ),
    paidAt: paid ? DateTime.utc(2030, 7, 1) : null,
    refundedAt: null,
    version: 1,
  );

  @override
  Future<PaymentOptions> options(String clinicId) async => const PaymentOptions(
    methods: [PaymentMethod.counter, PaymentMethod.online],
    onlineProvider: 'fib',
  );
  @override
  Future<AppointmentPayment> choose(String id, PaymentMethod method) async {
    chosen.add(method);
    return _payment(method);
  }

  @override
  Future<AppointmentPayment> get(String id) async =>
      _payment(PaymentMethod.online);
  @override
  Future<AppointmentPayment> refresh(String id) async =>
      _payment(PaymentMethod.online);
}

class _BookingRepository implements BookingRepository {
  int createCalls = 0;
  @override
  Future<BookingAvailability> loadOptions(
    BookingOptionsRequest request,
  ) async => options;

  @override
  Future<BookingConfirmation> create(
    BookingDraft draft,
    String operationId,
  ) async {
    createCalls++;
    return confirmation;
  }
}

const profileId = '00000000-0000-4000-8000-000000000004';
const clinic = BookingClinicOption(
  id: '00000000-0000-4000-8000-000000000003',
  displayName: 'Saxlem Clinic',
);
const doctor = BookingDoctorReference(
  id: '00000000-0000-4000-8000-000000000001',
  displayName: 'Dr. Dilan',
  clinics: [clinic],
);
final slot = AppointmentSlot(
  startsAt: DateTime.utc(2030, 8, 10, 6),
  endsAt: DateTime.utc(2030, 8, 10, 6, 30),
  durationMinutes: 30,
);
final options = BookingAvailability(
  doctorId: doctor.id,
  doctorName: doctor.displayName,
  organizationId: '00000000-0000-4000-8000-000000000002',
  clinicId: clinic.id,
  clinicName: clinic.displayName,
  clinicTimezone: 'Asia/Baghdad',
  appointmentType: BookingAppointmentType.initial,
  durationMinutes: 30,
  feeIqd: 35000,
  currency: 'IQD',
  dateFrom: DateTime.utc(2030, 8, 10),
  dateTo: DateTime.utc(2030, 8, 11),
  days: [
    BookingDay(date: DateTime.utc(2030, 8, 10), slots: [slot]),
    BookingDay(date: DateTime.utc(2030, 8, 11), slots: const []),
  ],
  generatedAt: DateTime.utc(2030, 8, 9),
);
final confirmation = BookingConfirmation(
  appointmentId: '00000000-0000-4000-8000-000000000005',
  reference: 'SX-2030-000001',
  clinicId: clinic.id,
  clinicName: clinic.displayName,
  clinicTimezone: 'Asia/Baghdad',
  doctorId: doctor.id,
  doctorName: doctor.displayName,
  patientProfileId: profileId,
  patientName: 'Patient One',
  startsAt: slot.startsAt,
  endsAt: slot.endsAt,
  durationMinutes: 30,
  feeIqd: 35000,
  version: 1,
);
