import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:saxlem_app/config/environment/app_configuration.dart';
import 'package:saxlem_app/core/network/api_client.dart';
import 'package:saxlem_app/core/network/authenticated_api_client.dart';
import 'package:saxlem_app/features/authentication/domain/repositories/auth_repository.dart';
import 'package:saxlem_app/features/payments/data/backend_payments_repository.dart';
import 'package:saxlem_app/features/payments/domain/appointment_payment.dart';
import 'package:saxlem_app/features/payments/domain/payments_repository.dart';
import 'package:saxlem_app/features/payments/domain/receipt.dart';

const appointmentId = '01a1e0f5-05cb-713b-a70f-946f28664cd3';
const clinicId = '01a1e0f5-05cb-713b-a70f-946f28664cd4';

Map<String, Object?> payment({
  String status = 'pending',
  String method = 'online',
  Map<String, Object?>? online,
}) => {
  'appointmentId': appointmentId,
  'method': method,
  'status': status,
  'amountIqd': 25000,
  'currency': 'IQD',
  'provider': 'fib',
  'onlineAvailable': true,
  'online':
      online ??
      {
        'readableCode': 'AB12-CD34',
        'qrCode': 'data:image/png;base64,AAAA',
        'personalAppLink': 'https://personal.fib.iq/pay/1',
        'businessAppLink': 'intent://not-allowed',
        'validUntil': '2030-01-01T10:30:00.000Z',
      },
  'paidAt': null,
  'refundedAt': null,
  'version': 1,
};

void main() {
  test('chooses online payment with an exact command', () async {
    late http.Request captured;
    final repository = _repository(
      MockClient((request) async {
        captured = request;
        return http.Response(jsonEncode(payment()), 200);
      }),
    );
    final result = await repository.choose(appointmentId, PaymentMethod.online);
    expect(captured.method, 'POST');
    expect(captured.url.path, '/api/v1/appointments/$appointmentId/payment');
    expect(jsonDecode(captured.body), {'method': 'online'});
    expect(result.status, PaymentStatus.pending);
    expect(result.online?.readableCode, 'AB12-CD34');
    expect(result.online?.personalAppLink?.host, 'personal.fib.iq');
    expect(result.online?.businessAppLink, isNull, reason: 'only https opens');
    expect(result.awaitingOnline, isTrue);
  });

  test('reads clinic options and maps paid and refunded states', () async {
    final repository = _repository(
      MockClient((request) async {
        if (request.url.path.endsWith('/payments/options')) {
          expect(request.url.queryParameters, {'clinicId': clinicId});
          return http.Response(
            jsonEncode({
              'clinicId': clinicId,
              'methods': ['counter', 'online'],
              'onlineProvider': 'fib',
              'currency': 'IQD',
            }),
            200,
          );
        }
        return http.Response(jsonEncode(payment(status: 'refunded')), 200);
      }),
    );
    expect((await repository.options(clinicId)).onlineAvailable, isTrue);
    final refunded = await repository.refresh(appointmentId);
    expect(refunded.status, PaymentStatus.refunded);
    expect(refunded.isPaid, isTrue);
    expect(refunded.canPayOnline, isFalse);
  });

  test('maps conflicts and rejects mismatched responses', () async {
    final conflict = _repository(
      MockClient(
        (_) async => http.Response(
          jsonEncode({
            'error': {
              'code': 'CONFLICT',
              'message': 'The request could not be completed.',
              'requestId': 'request-1',
              'retryable': false,
              'fieldErrors': <Object>[],
            },
          }),
          409,
        ),
      ),
    );
    await expectLater(
      conflict.choose(appointmentId, PaymentMethod.counter),
      throwsA(
        isA<PaymentFailure>().having(
          (f) => f.problem,
          'problem',
          PaymentProblem.notAccepted,
        ),
      ),
    );
    final mismatch = _repository(
      MockClient(
        (_) async => http.Response(
          jsonEncode({...payment(), 'appointmentId': clinicId}),
          200,
        ),
      ),
    );
    await expectLater(
      mismatch.get(appointmentId),
      throwsA(isA<PaymentFailure>()),
    );
    await expectLater(
      mismatch.get('not-a-uuid'),
      throwsA(isA<PaymentFailure>()),
    );
  });

  test('reads payment history and follows the cursor', () async {
    final asked = <Uri>[];
    final repository = _repository(
      MockClient((request) async {
        asked.add(request.url);
        return http.Response.bytes(
          utf8.encode(
            jsonEncode({
              'items': [receipt()],
              'nextCursor': 'next-page',
            }),
          ),
          200,
          headers: {'content-type': 'application/json; charset=utf-8'},
        );
      }),
    );
    final first = await repository.receipts();
    await repository.receipts(cursor: first.nextCursor);
    expect(asked.first.path, '/api/v1/patients/me/payments');
    expect(asked.first.queryParameters, isEmpty);
    expect(asked.last.queryParameters, {'cursor': 'next-page'});
    final item = first.items.single;
    expect(item.reference, 'SX-2026-000123');
    expect(item.method, PaymentMethod.online);
    expect(item.collectedBy, ReceiptCollector.platform);
    expect(item.paidAt, DateTime.utc(2026, 11, 3, 8));
    expect(item.clinicAddress, 'Zakho Road, Duhok');
  });

  test('a receipt must be for money that changed hands', () async {
    final repository = _repository(
      MockClient(
        (_) async => http.Response(jsonEncode(receipt(status: 'pending')), 200),
      ),
    );
    await expectLater(
      repository.receipt(appointmentId),
      throwsA(isA<PaymentFailure>()),
    );
  });

  test('no receipt yet reads as a failure, not a crash', () async {
    final repository = _repository(
      MockClient((_) async => http.Response('{}', 404)),
    );
    await expectLater(
      repository.receipt(appointmentId),
      throwsA(isA<PaymentFailure>()),
    );
  });
}

Map<String, Object?> receipt({String status = 'paid'}) => {
  'id': '01a1e0f5-05cb-713b-a70f-946f28664cd9',
  'appointmentId': appointmentId,
  'reference': 'SX-2026-000123',
  'patientName': 'Avin Kawa',
  'doctorName': 'Dr. Shilan Ahmed',
  'clinicName': 'Hillview Clinic',
  'clinicAddress': 'Zakho Road, Duhok',
  'clinicPhone': null,
  'organizationName': 'Hillview Medical',
  'visitStartsAt': '2026-11-04T06:00:00.000Z',
  'method': 'online',
  'provider': 'fib',
  'transactionId': 'fib-7731',
  'collectedBy': 'platform',
  'amountIqd': 25000,
  'currency': 'IQD',
  'status': status,
  'paidAt': '2026-11-03T08:00:00.000Z',
  'refundedAt': null,
};

BackendPaymentsRepository _repository(http.Client client) {
  final storage = _Storage();
  return BackendPaymentsRepository(
    AuthenticatedApiClient(
      api: ApiClient(
        configuration: AppConfiguration.fromValues(
          environment: 'production',
          apiBaseUrl: 'https://api.saxlem.test',
        ),
        client: client,
      ),
      storage: storage,
      refresh: () async => storage.session,
    ),
  );
}

class _Storage implements SessionStorage {
  final session = StoredSession(
    phoneNumber: '+9647500000000',
    expiresAt: DateTime.utc(2031),
    accessToken: 'access',
    refreshToken: 'refresh',
    deviceId: '00000000-0000-4000-8000-000000000009',
  );
  @override
  Future<void> clear() async {}
  @override
  Future<StoredSession?> read() async => session;
  @override
  Future<void> write(StoredSession session) async {}
}
