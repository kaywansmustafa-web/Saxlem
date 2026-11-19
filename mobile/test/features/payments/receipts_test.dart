import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:saxlem_app/config/theme/app_theme.dart';
import 'package:saxlem_app/features/payments/domain/appointment_payment.dart';
import 'package:saxlem_app/features/payments/domain/payments_repository.dart';
import 'package:saxlem_app/features/payments/domain/receipt.dart';
import 'package:saxlem_app/features/payments/presentation/pages/payment_history_page.dart';
import 'package:saxlem_app/features/payments/presentation/widgets/appointment_payment_card.dart';
import 'package:saxlem_app/l10n/app_localizations.dart';

const appointmentId = '01a1e0f5-05cb-713b-a70f-946f28664cd3';

Receipt receipt(
  String id,
  DateTime paidAt, {
  PaymentMethod method = PaymentMethod.online,
  PaymentStatus status = PaymentStatus.paid,
}) => Receipt(
  id: id,
  appointmentId: appointmentId,
  reference: 'SX-2026-000123',
  patientName: 'Avin Kawa',
  doctorName: 'Dr. Shilan Ahmed',
  clinicName: 'Hillview Clinic',
  clinicAddress: 'Zakho Road, Duhok',
  clinicPhone: null,
  organizationName: 'Hillview Medical',
  visitStartsAt: paidAt.add(const Duration(days: 1)),
  method: method,
  provider: method == PaymentMethod.online ? 'fib' : null,
  transactionId: method == PaymentMethod.online ? 'fib-7731' : null,
  collectedBy: method == PaymentMethod.online
      ? ReceiptCollector.platform
      : null,
  amountIqd: 25000,
  status: status,
  paidAt: paidAt,
  refundedAt: status == PaymentStatus.refunded
      ? paidAt.add(const Duration(hours: 1))
      : null,
);

class _Repository implements PaymentsRepository, ReceiptsSource {
  _Repository(this.pages);
  final List<ReceiptList> pages;
  final cursors = <String?>[];
  @override
  Future<ReceiptList> receipts({String? cursor}) async {
    cursors.add(cursor);
    return pages[cursors.length - 1];
  }

  @override
  Future<Receipt> receipt(String appointmentId) async =>
      pages.first.items.first;
  @override
  Future<AppointmentPayment> get(String appointmentId) async =>
      AppointmentPayment(
        appointmentId: appointmentId,
        method: PaymentMethod.counter,
        status: PaymentStatus.paid,
        amountIqd: 25000,
        provider: null,
        onlineAvailable: false,
        online: null,
        paidAt: DateTime.utc(2026, 11, 3, 8),
        refundedAt: null,
        version: 2,
      );
  @override
  Future<PaymentOptions> options(String clinicId) async =>
      PaymentOptions.counterOnly;
  @override
  Future<AppointmentPayment> choose(String a, PaymentMethod m) =>
      throw UnimplementedError();
  @override
  Future<AppointmentPayment> refresh(String a) => throw UnimplementedError();
}

Widget _app(Widget home) => MaterialApp(
  theme: AppTheme.light,
  supportedLocales: AppLocalizations.supportedLocales,
  localizationsDelegates: AppLocalizations.localizationsDelegates,
  home: home,
);

void main() {
  testWidgets('history groups by month, loads more and opens a receipt', (
    tester,
  ) async {
    final repository = _Repository([
      ReceiptList(
        items: [
          receipt(
            '01a1e0f5-05cb-713b-a70f-946f28664ca1',
            DateTime.utc(2026, 11, 3, 8),
          ),
          receipt(
            '01a1e0f5-05cb-713b-a70f-946f28664ca2',
            DateTime.utc(2026, 10, 20, 8),
            status: PaymentStatus.refunded,
          ),
        ],
        nextCursor: 'more',
      ),
      ReceiptList(
        items: [
          receipt(
            '01a1e0f5-05cb-713b-a70f-946f28664ca3',
            DateTime.utc(2026, 9, 1, 8),
            method: PaymentMethod.counter,
          ),
        ],
        nextCursor: null,
      ),
    ]);
    await tester.pumpWidget(_app(PaymentHistoryPage(source: repository)));
    await tester.pumpAndSettle();
    expect(find.text('NOV 2026'), findsOneWidget);
    expect(find.text('OCT 2026'), findsOneWidget);
    expect(find.text('Refunded'), findsOneWidget);
    await tester.tap(find.text('Load more'));
    await tester.pumpAndSettle();
    expect(repository.cursors, [null, 'more']);
    expect(find.text('SEP 2026'), findsOneWidget);
    expect(find.text('Load more'), findsNothing);

    await tester.tap(find.text('3 Nov 2026 · Avin Kawa'));
    await tester.pumpAndSettle();
    expect(find.text('Receipt'), findsOneWidget);
    expect(find.text('25,000 IQD'), findsOneWidget);
    expect(find.text('Saxlem, for Hillview Medical'), findsOneWidget);
    expect(find.text('FIB, in the app'), findsOneWidget);
    expect(find.textContaining('fib-7731'), findsOneWidget);

    String? copied;
    tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
      SystemChannels.platform,
      (call) async {
        if (call.method == 'Clipboard.setData') {
          copied = (call.arguments as Map)['text'] as String;
        }
        return null;
      },
    );
    await tester.scrollUntilVisible(
      find.text('Copy receipt'),
      200,
      scrollable: find.byType(Scrollable).last,
    );
    await tester.tap(find.text('Copy receipt'));
    await tester.pumpAndSettle();
    expect(copied, contains('Saxlem receipt'));
    expect(copied, contains('Amount: 25,000 IQD'));
    expect(copied, contains('Receipt no.: SX-2026-000123'));
    expect(find.text('Receipt copied'), findsOneWidget);
  });

  testWidgets('no payments yet', (tester) async {
    await tester.pumpWidget(
      _app(
        PaymentHistoryPage(
          source: _Repository([const ReceiptList(items: [], nextCursor: null)]),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('No payments yet'), findsOneWidget);
  });

  testWidgets('a paid visit links to its receipt', (tester) async {
    final repository = _Repository([
      ReceiptList(
        items: [
          receipt(
            '01a1e0f5-05cb-713b-a70f-946f28664ca1',
            DateTime.utc(2026, 11, 3, 8),
            method: PaymentMethod.counter,
          ),
        ],
        nextCursor: null,
      ),
    ]);
    await tester.pumpWidget(
      _app(
        Scaffold(
          body: AppointmentPaymentCard(
            appointmentId: appointmentId,
            repository: repository,
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('View receipt'));
    await tester.pumpAndSettle();
    expect(find.text('At the clinic desk'), findsOneWidget);
    expect(find.text('Hillview Medical'), findsOneWidget);
  });
}
