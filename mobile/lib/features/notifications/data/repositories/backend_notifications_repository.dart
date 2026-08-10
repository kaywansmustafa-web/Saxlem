import 'dart:async';
import 'dart:math';
import '../../../../core/models/patient_profile.dart';
import '../../../../core/network/api_failure.dart';
import '../../../../core/network/authenticated_api_client.dart';
import '../../domain/entities/notification_page.dart';
import '../../domain/entities/notification_snapshot.dart';
import '../../domain/entities/patient_notification.dart';
import '../../domain/repositories/authoritative_notifications_repository.dart';
import '../../domain/repositories/notifications_repository.dart';
import '../dto/backend_notification_dto.dart';
import '../stream/authenticated_notification_sse_transport.dart';

class BackendNotificationsRepository
    implements NotificationsRepository, AuthoritativeNotificationsRepository {
  BackendNotificationsRepository(this._api, this._transport, {Random? random})
    : _random = random ?? Random.secure();
  final AuthenticatedApiClient _api;
  final AuthenticatedNotificationSseTransport _transport;
  final Random _random;
  final _inFlight = <String, Future<PatientNotification>>{};
  @override
  Future<NotificationPage> list({String? cursor, int pageSize = 25}) async {
    if (pageSize < 1 ||
        pageSize > 100 ||
        cursor != null && !RegExp(r'^[\x21-\x7e]{1,512}$').hasMatch(cursor))
      throw const NotificationFailure(NotificationProblem.validation);
    try {
      return BackendNotificationDto.parsePage(
        (await _api.getJson(
          '/notifications',
          queryParameters: {
            'pageSize': '$pageSize',
            'unreadOnly': 'false',
            'cursor': ?cursor,
          },
        )).body,
      );
    } on FormatException {
      throw const NotificationFailure(NotificationProblem.malformed);
    } on ApiFailure catch (e) {
      throw NotificationFailure(_map(e, false));
    }
  }

  @override
  Future<NotificationSnapshot> load([
    PatientProfileId profileId = PatientProfileId.me,
  ]) async => NotificationSnapshot(notifications: (await list()).items);
  @override
  Stream<NotificationSnapshot> watch([
    PatientProfileId profileId = PatientProfileId.me,
  ]) => const Stream.empty();
  @override
  Future<PatientNotification?> get(NotificationId id) async => null;
  @override
  Future<PatientNotification> markNotificationRead(NotificationId id) =>
      _inFlight.putIfAbsent(
        id.value,
        () => _mark(id).whenComplete(() {
          _inFlight.remove(id.value);
        }),
      );
  Future<PatientNotification> _mark(NotificationId id) async {
    if (!RegExp(
      r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$',
    ).hasMatch(id.value))
      throw const NotificationFailure(NotificationProblem.validation);
    final key =
        'notification-${List.generate(24, (_) => _random.nextInt(256).toRadixString(16).padLeft(2, '0')).join()}';
    try {
      final body = (await _api.postJson(
        '/notifications/${id.value}/read',
        body: const {},
        idempotencyKey: key,
      )).body;
      if (body.keys.length != 1 ||
          body['notification'] is! Map<String, dynamic>)
        throw const FormatException();
      return BackendNotificationDto.parse(
        body['notification'] as Map<String, dynamic>,
      );
    } on FormatException {
      throw const NotificationFailure(NotificationProblem.malformed);
    } on MutationNotSentFailure catch (e) {
      throw NotificationFailure(_map(e.failure, false));
    } on ApiFailure catch (e) {
      throw NotificationFailure(_map(e, true));
    }
  }

  @override
  Future<void> markRead(NotificationId id) async {
    await markNotificationRead(id);
  }

  @override
  Stream<NotificationSignal> stream({String? lastEventId}) =>
      _transport.open(lastEventId: lastEventId);
  @override
  Future<void> closeStream() async => _transport.close();
  @override
  Future<void> dispose() => closeStream();
  static NotificationProblem _map(ApiFailure e, bool mutation) =>
      switch (e.type) {
        ApiFailureType.validation => NotificationProblem.validation,
        ApiFailureType.unauthenticated => NotificationProblem.sessionExpired,
        ApiFailureType.forbidden => NotificationProblem.forbidden,
        ApiFailureType.notFound => NotificationProblem.notFound,
        ApiFailureType.conflict => NotificationProblem.conflict,
        ApiFailureType.offline =>
          mutation
              ? NotificationProblem.unknownOutcome
              : NotificationProblem.offline,
        ApiFailureType.timeout =>
          mutation
              ? NotificationProblem.unknownOutcome
              : NotificationProblem.timeout,
        ApiFailureType.malformedResponse => NotificationProblem.malformed,
        ApiFailureType.server ||
        ApiFailureType.unavailable => NotificationProblem.unavailable,
        _ => NotificationProblem.unknown,
      };
}

class UnavailableNotificationsRepository
    implements NotificationsRepository, AuthoritativeNotificationsRepository {
  const UnavailableNotificationsRepository();
  Never _fail() =>
      throw const NotificationFailure(NotificationProblem.unavailable);
  @override
  Future<NotificationPage> list({String? cursor, int pageSize = 25}) async =>
      _fail();
  @override
  Future<NotificationSnapshot> load([
    PatientProfileId profileId = PatientProfileId.me,
  ]) async => _fail();
  @override
  Stream<NotificationSnapshot> watch([
    PatientProfileId profileId = PatientProfileId.me,
  ]) =>
      Stream.error(const NotificationFailure(NotificationProblem.unavailable));
  @override
  Future<PatientNotification?> get(NotificationId id) async => _fail();
  @override
  Future<void> markRead(NotificationId id) async => _fail();
  @override
  Future<PatientNotification> markNotificationRead(NotificationId id) async =>
      _fail();
  @override
  Stream<NotificationSignal> stream({String? lastEventId}) =>
      Stream.error(const NotificationFailure(NotificationProblem.unavailable));
  @override
  Future<void> closeStream() async {}
  @override
  Future<void> dispose() async {}
}

// ignore_for_file: curly_braces_in_flow_control_structures
