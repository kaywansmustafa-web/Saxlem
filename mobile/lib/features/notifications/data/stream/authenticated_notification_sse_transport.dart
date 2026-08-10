import 'dart:async';
import 'package:http/http.dart' as http;
import '../../../../config/environment/app_configuration.dart';
import '../../../../core/network/api_failure.dart';
import '../../../authentication/domain/repositories/auth_repository.dart';
import '../../domain/entities/notification_page.dart';
import '../../domain/repositories/authoritative_notifications_repository.dart';
import 'notification_sse_parser.dart';

class AuthenticatedNotificationSseTransport {
  AuthenticatedNotificationSseTransport({
    required AppConfiguration configuration,
    required SessionStorage storage,
    required Future<StoredSession> Function() refresh,
    http.Client? client,
  }) : _configuration = configuration,
       _storage = storage,
       _refresh = refresh,
       _client = client ?? http.Client();
  final AppConfiguration _configuration;
  final SessionStorage _storage;
  final Future<StoredSession> Function() _refresh;
  late http.Client _client;
  bool _closed = false;
  Stream<NotificationSignal> open({String? lastEventId}) async* {
    if (_closed) {
      _client = http.Client();
      _closed = false;
    }
    if (lastEventId != null &&
        !RegExp(r'^[1-9]\d{0,18}$').hasMatch(lastEventId))
      throw const NotificationFailure(NotificationProblem.validation);
    var session = await _storage.read();
    if (session == null || !session.isBackendSession)
      throw const NotificationFailure(NotificationProblem.sessionExpired);
    if (!session.expiresAt.isAfter(DateTime.now().toUtc())) {
      try {
        session = await _refresh();
      } on ApiFailure {
        throw const NotificationFailure(NotificationProblem.sessionExpired);
      }
    }
    final request =
        http.Request('GET', _configuration.apiEndpoint('/notifications/stream'))
          ..followRedirects = false
          ..maxRedirects = 0
          ..headers['accept'] = 'text/event-stream'
          ..headers['authorization'] = 'Bearer ${session.accessToken}';
    if (lastEventId != null) request.headers['last-event-id'] = lastEventId;
    try {
      final response = await _client
          .send(request)
          .timeout(_configuration.apiTimeout);
      if (response.statusCode == 401) {
        await response.stream.drain<void>();
        await _storage.clear();
        throw const NotificationFailure(NotificationProblem.sessionExpired);
      }
      if (response.statusCode == 403) {
        await response.stream.drain<void>();
        throw const NotificationFailure(NotificationProblem.forbidden);
      }
      if (response.statusCode != 200 ||
          !(response.headers['content-type'] ?? '').toLowerCase().startsWith(
            'text/event-stream',
          )) {
        await response.stream.drain<void>();
        throw const NotificationFailure(NotificationProblem.unavailable);
      }
      yield* const NotificationSseParser().parse(response.stream);
    } on TimeoutException {
      throw const NotificationFailure(NotificationProblem.timeout);
    } on http.ClientException {
      throw const NotificationFailure(NotificationProblem.offline);
    }
  }

  void close() {
    if (_closed) return;
    _closed = true;
    _client.close();
  }
}

// ignore_for_file: curly_braces_in_flow_control_structures, prefer_initializing_formals
