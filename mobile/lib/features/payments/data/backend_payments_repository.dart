import '../../../core/network/api_failure.dart';
import '../../../core/network/authenticated_api_client.dart';
import '../domain/appointment_payment.dart';
import '../domain/payments_repository.dart';

class BackendPaymentsRepository implements PaymentsRepository {
  BackendPaymentsRepository(this._api);
  final AuthenticatedApiClient _api;
  static final _uuid = RegExp(
    r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$',
  );

  @override
  Future<PaymentOptions> options(String clinicId) async {
    _requireUuid(clinicId);
    return _guard(() async {
      final response = await _api.getJson(
        '/payments/options',
        queryParameters: {'clinicId': clinicId},
      );
      final methods = response.body['methods'];
      if (methods is! List) throw const FormatException('methods');
      return PaymentOptions(
        methods: [
          for (final m in methods)
            if (m == 'counter')
              PaymentMethod.counter
            else if (m == 'online')
              PaymentMethod.online,
        ],
        onlineProvider: response.body['onlineProvider'] as String?,
      );
    });
  }

  @override
  Future<AppointmentPayment> get(String appointmentId) async {
    _requireUuid(appointmentId);
    return _guard(
      () async => parsePayment(
        (await _api.getJson('/appointments/$appointmentId/payment')).body,
        appointmentId,
      ),
    );
  }

  @override
  Future<AppointmentPayment> choose(
    String appointmentId,
    PaymentMethod method,
  ) {
    _requireUuid(appointmentId);
    return _guard(
      () async => parsePayment(
        (await _api.postJson(
          '/appointments/$appointmentId/payment',
          body: {'method': method.name},
        )).body,
        appointmentId,
      ),
    );
  }

  @override
  Future<AppointmentPayment> refresh(String appointmentId) async {
    _requireUuid(appointmentId);
    return _guard(
      () async => parsePayment(
        (await _api.postJson(
          '/appointments/$appointmentId/payment/refresh',
          body: const {},
        )).body,
        appointmentId,
      ),
    );
  }

  static AppointmentPayment parsePayment(
    Map<String, Object?> body,
    String appointmentId,
  ) {
    if (body['appointmentId'] != appointmentId) {
      throw const FormatException('appointmentId');
    }
    final amount = body['amountIqd'];
    final version = body['version'];
    if (amount is! int || amount <= 0 || version is! int) {
      throw const FormatException('amount');
    }
    final method = switch (body['method']) {
      'counter' => PaymentMethod.counter,
      'online' => PaymentMethod.online,
      _ => throw const FormatException('method'),
    };
    final online = body['online'];
    OnlinePaymentDetails? details;
    if (online is Map<String, Object?>) {
      details = OnlinePaymentDetails(
        readableCode: online['readableCode'] as String?,
        qrCode: _dataUrl(online['qrCode']),
        personalAppLink: _link(online['personalAppLink']),
        businessAppLink: _link(online['businessAppLink']),
        validUntil: _date(online['validUntil']),
      );
    }
    return AppointmentPayment(
      appointmentId: appointmentId,
      method: method,
      status: PaymentStatus.parse(body['status']),
      amountIqd: amount,
      provider: body['provider'] as String?,
      onlineAvailable: body['onlineAvailable'] == true,
      online: details,
      paidAt: _date(body['paidAt']),
      refundedAt: _date(body['refundedAt']),
      version: version,
    );
  }

  static DateTime? _date(Object? value) =>
      value is String ? DateTime.parse(value) : null;

  /// Only https links are opened, so a bad response cannot launch anything else.
  static Uri? _link(Object? value) {
    if (value is! String) return null;
    final uri = Uri.tryParse(value);
    return uri != null && uri.scheme == 'https' ? uri : null;
  }

  static String? _dataUrl(Object? value) =>
      value is String && value.startsWith('data:image/png;base64,')
      ? value
      : null;

  static void _requireUuid(String value) {
    if (!_uuid.hasMatch(value)) {
      throw const PaymentFailure(PaymentProblem.unknown);
    }
  }

  static Future<T> _guard<T>(Future<T> Function() action) async {
    try {
      return await action();
    } on FormatException {
      throw const PaymentFailure(PaymentProblem.unknown);
    } on MutationNotSentFailure catch (failure) {
      throw PaymentFailure(_problem(failure.failure));
    } on ApiFailure catch (failure) {
      throw PaymentFailure(_problem(failure));
    }
  }

  static PaymentProblem _problem(ApiFailure failure) => switch (failure.type) {
    ApiFailureType.offline || ApiFailureType.timeout => PaymentProblem.offline,
    ApiFailureType.unauthenticated => PaymentProblem.sessionExpired,
    ApiFailureType.conflict => PaymentProblem.notAccepted,
    ApiFailureType.unavailable ||
    ApiFailureType.server => PaymentProblem.unavailable,
    _ => PaymentProblem.unknown,
  };
}
