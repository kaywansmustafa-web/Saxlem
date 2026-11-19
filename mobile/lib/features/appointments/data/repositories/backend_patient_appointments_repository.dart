import '../../../booking/domain/entities/appointment_slot.dart';
import '../../../reviews/data/review_dto.dart';
import '../../../reviews/domain/review.dart';
import '../../../../core/models/patient_profile.dart';
import '../../../../core/network/api_failure.dart';
import '../../../../core/network/authenticated_api_client.dart';
import '../../domain/entities/appointments_snapshot.dart';
import '../../domain/entities/patient_appointment.dart';
import '../../domain/repositories/patient_appointments_repository.dart';
import '../../../../core/location/geo_point.dart';
import '../../domain/entities/departure_plan.dart';
import '../dto/departure_plan_dto.dart';
import '../dto/patient_appointment_dto.dart';

class BackendPatientAppointmentsRepository
    implements
        PatientAppointmentsRepository,
        DeparturePlanner,
        VisitReviewSource,
        EarlierTimeSource {
  BackendPatientAppointmentsRepository(this._api);
  final AuthenticatedApiClient _api;
  static final _uuid = RegExp(
    r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$',
  );
  static final _cursor = RegExp(r'^[\x21-\x7e]{1,1024}$');

  @override
  Future<AppointmentPage> list(AppointmentListRequest request) async {
    _uuidValue(request.profileId.value);
    if (request.pageSize < 1 ||
        request.pageSize > 50 ||
        request.cursor != null && !_cursor.hasMatch(request.cursor!) ||
        !request.to.isAfter(request.from) ||
        request.to.difference(request.from) > const Duration(days: 366)) {
      throw const AppointmentFailure(AppointmentProblem.validation);
    }
    try {
      final response = await _api.getJson(
        '/appointments',
        queryParameters: {
          'patientProfileId': request.profileId.value,
          'from': request.from.toUtc().toIso8601String(),
          'to': request.to.toUtc().toIso8601String(),
          'pageSize': request.pageSize.toString(),
          'status': request.status.name,
          'cursor': ?request.cursor,
        },
      );
      final page = PatientAppointmentDto.parsePage(response.body);
      if (page.items.any(
        (item) =>
            item.profileId != request.profileId ||
            item.status != request.status ||
            item.startsAt.isBefore(request.from) ||
            !item.startsAt.isBefore(request.to),
      )) {
        throw const FormatException();
      }
      return page;
    } on FormatException {
      throw const AppointmentFailure(AppointmentProblem.malformed);
    } on ApiFailure catch (failure) {
      throw AppointmentFailure(_problem(failure, mutation: false));
    }
  }

  @override
  Future<PatientAppointment> detail(
    String appointmentId,
    PatientProfileId profileId,
  ) async {
    _uuidValue(appointmentId);
    _uuidValue(profileId.value);
    try {
      final response = await _api.getJson('/appointments/$appointmentId');
      final item = PatientAppointmentDto.parse(response.body);
      if (item.id != appointmentId || item.profileId != profileId) {
        throw const FormatException();
      }
      return item;
    } on FormatException {
      throw const AppointmentFailure(AppointmentProblem.malformed);
    } on ApiFailure catch (failure) {
      throw AppointmentFailure(_problem(failure, mutation: false));
    }
  }

  /// The patient's position goes to the server for this one calculation;
  /// the server does not keep it.
  @override
  Future<DeparturePlan> departure(String appointmentId, GeoPoint from) async {
    _uuidValue(appointmentId);
    if (from.latitude.abs() > 90 ||
        from.longitude.abs() > 180 ||
        from.latitude.isNaN ||
        from.longitude.isNaN) {
      throw const AppointmentFailure(AppointmentProblem.validation);
    }
    try {
      final response = await _api.postJson(
        '/appointments/$appointmentId/departure',
        body: {
          // About 1 m is plenty for driving directions.
          'latitude': double.parse(from.latitude.toStringAsFixed(5)),
          'longitude': double.parse(from.longitude.toStringAsFixed(5)),
        },
      );
      return DeparturePlanDto.parse(response.body);
    } on FormatException {
      throw const AppointmentFailure(AppointmentProblem.malformed);
    } on MutationNotSentFailure catch (failure) {
      throw AppointmentFailure(_problem(failure.failure, mutation: false));
    } on ApiFailure catch (failure) {
      throw AppointmentFailure(_problem(failure, mutation: false));
    }
  }

  @override
  Future<EarlierTimeStatus> earlierTime(String appointmentId) async {
    _uuidValue(appointmentId);
    try {
      return _earlier(
        (await _api.getJson('/appointments/$appointmentId/earlier')).body,
      );
    } on FormatException {
      throw const AppointmentFailure(AppointmentProblem.malformed);
    } on ApiFailure catch (failure) {
      throw AppointmentFailure(_problem(failure, mutation: false));
    }
  }

  @override
  Future<EarlierTimeStatus> watchEarlierTime(
    String appointmentId, {
    required bool watch,
  }) async {
    _uuidValue(appointmentId);
    try {
      if (!watch) {
        await _api.deleteJson('/appointments/$appointmentId/earlier');
        return const EarlierTimeStatus(watching: false);
      }
      return _earlier(
        (await _api.postJson(
          '/appointments/$appointmentId/earlier',
          body: {},
        )).body,
      );
    } on FormatException {
      throw const AppointmentFailure(AppointmentProblem.malformed);
    } on MutationNotSentFailure catch (failure) {
      throw AppointmentFailure(_problem(failure.failure, mutation: false));
    } on ApiFailure catch (failure) {
      throw AppointmentFailure(_problem(failure, mutation: false));
    }
  }

  static EarlierTimeStatus _earlier(Map<String, dynamic> json) {
    if (json.keys.toSet().difference({'watching', 'offer'}).isNotEmpty ||
        json['watching'] is! bool) {
      throw const FormatException();
    }
    final raw = json['offer'];
    if (raw == null) {
      return EarlierTimeStatus(watching: json['watching'] as bool);
    }
    if (raw is! Map<String, dynamic> ||
        raw.keys.toSet().difference({
          'startsAt',
          'endsAt',
          'durationMinutes',
        }).isNotEmpty) {
      throw const FormatException();
    }
    if (raw['startsAt'] is! String || raw['endsAt'] is! String) {
      throw const FormatException();
    }
    final startsAt = DateTime.parse(raw['startsAt'] as String).toUtc();
    final endsAt = DateTime.parse(raw['endsAt'] as String).toUtc();
    final duration = raw['durationMinutes'];
    if (duration is! int ||
        duration < 5 ||
        endsAt.difference(startsAt).inMinutes != duration) {
      throw const FormatException();
    }
    return EarlierTimeStatus(
      watching: json['watching'] as bool,
      offer: AppointmentSlot(
        startsAt: startsAt,
        endsAt: endsAt,
        durationMinutes: duration,
      ),
    );
  }

  @override
  Future<VisitReviewStatus> visitReview(String appointmentId) async {
    _uuidValue(appointmentId);
    try {
      final response = await _api.getJson(
        '/appointments/$appointmentId/review',
      );
      return ReviewDto.status(response.body);
    } on FormatException {
      throw const ReviewFailure();
    } on ApiFailure {
      throw const ReviewFailure();
    }
  }

  @override
  Future<VisitReview> writeReview(
    String appointmentId, {
    required int rating,
    required String? comment,
    required bool anonymous,
  }) async {
    _uuidValue(appointmentId);
    final text = comment?.trim();
    if (rating < 1 ||
        rating > 5 ||
        (text != null && (text.length > 500 || !commentIsPublicSafe(text)))) {
      throw const ReviewFailure(invalidComment: true);
    }
    try {
      final response = await _api.postJson(
        '/appointments/$appointmentId/review',
        body: {
          'rating': rating,
          'comment': (text == null || text.isEmpty) ? null : text,
          'anonymous': anonymous,
        },
      );
      return ReviewDto.mine(response.body);
    } on FormatException {
      throw const ReviewFailure();
    } on MutationNotSentFailure {
      throw const ReviewFailure();
    } on ApiFailure catch (failure) {
      throw ReviewFailure(
        invalidComment: failure.type == ApiFailureType.validation,
      );
    }
  }

  @override
  Future<OnTheWay> onTheWay(String appointmentId, GeoPoint from) async {
    _uuidValue(appointmentId);
    if (from.latitude.abs() > 90 ||
        from.longitude.abs() > 180 ||
        from.latitude.isNaN ||
        from.longitude.isNaN) {
      throw const AppointmentFailure(AppointmentProblem.validation);
    }
    try {
      final response = await _api.postJson(
        '/appointments/$appointmentId/on-the-way',
        body: {
          'latitude': double.parse(from.latitude.toStringAsFixed(5)),
          'longitude': double.parse(from.longitude.toStringAsFixed(5)),
        },
      );
      return DeparturePlanDto.parseOnTheWay(response.body);
    } on FormatException {
      throw const AppointmentFailure(AppointmentProblem.malformed);
    } on MutationNotSentFailure catch (failure) {
      throw AppointmentFailure(_problem(failure.failure, mutation: false));
    } on ApiFailure catch (failure) {
      throw AppointmentFailure(_problem(failure, mutation: false));
    }
  }

  @override
  Future<PatientAppointment> cancel(
    AppointmentCancellation command,
    String operationId,
  ) async {
    final reason = command.reason.trim();
    final item = await _mutation(
      appointmentId: command.appointmentId,
      profileId: command.profileId,
      operationId: operationId,
      path: '/appointments/${command.appointmentId}/cancel',
      body: {'reason': reason, 'version': command.version},
    );
    if (item.status != PatientAppointmentStatus.cancelled ||
        item.cancellationReason != reason ||
        item.version <= command.version) {
      throw const AppointmentFailure(AppointmentProblem.malformed);
    }
    return item;
  }

  @override
  Future<PatientAppointment> reschedule(
    AppointmentReschedule command,
    String operationId,
  ) async {
    final item = await _mutation(
      appointmentId: command.appointmentId,
      profileId: command.profileId,
      operationId: operationId,
      path: '/appointments/${command.appointmentId}/reschedule',
      body: {
        'startsAt': command.startsAt.toUtc().toIso8601String(),
        'durationMinutes': command.durationMinutes,
        'version': command.version,
      },
    );
    if (!item.startsAt.isAtSameMomentAs(command.startsAt) ||
        item.durationMinutes != command.durationMinutes ||
        item.version <= command.version) {
      throw const AppointmentFailure(AppointmentProblem.malformed);
    }
    return item;
  }

  Future<PatientAppointment> _mutation({
    required String appointmentId,
    required PatientProfileId profileId,
    required String operationId,
    required String path,
    required Map<String, Object?> body,
  }) async {
    _uuidValue(appointmentId);
    _uuidValue(profileId.value);
    final reason = body['reason'];
    if (!RegExp(r'^[\x21-\x7e]{8,128}$').hasMatch(operationId) ||
        body['version'] is! int ||
        (body['version'] as int) < 1 ||
        reason != null &&
            (reason is! String || reason.isEmpty || reason.length > 500)) {
      throw const AppointmentFailure(AppointmentProblem.validation);
    }
    try {
      final response = await _api.postJson(
        path,
        body: body,
        idempotencyKey: operationId,
      );
      final item = PatientAppointmentDto.parse(response.body);
      if (item.id != appointmentId || item.profileId != profileId) {
        throw const FormatException();
      }
      return item;
    } on FormatException {
      throw const AppointmentFailure(AppointmentProblem.malformed);
    } on MutationNotSentFailure catch (failure) {
      throw AppointmentFailure(_problem(failure.failure, mutation: false));
    } on ApiFailure catch (failure) {
      throw AppointmentFailure(_problem(failure, mutation: true));
    }
  }

  static AppointmentProblem _problem(
    ApiFailure failure, {
    required bool mutation,
  }) => switch (failure.type) {
    ApiFailureType.offline ||
    ApiFailureType.timeout when mutation => AppointmentProblem.unknownOutcome,
    ApiFailureType.offline => AppointmentProblem.offline,
    ApiFailureType.timeout => AppointmentProblem.timeout,
    ApiFailureType.unauthenticated => AppointmentProblem.sessionExpired,
    ApiFailureType.forbidden => AppointmentProblem.forbidden,
    ApiFailureType.notFound => AppointmentProblem.notFound,
    ApiFailureType.conflict => AppointmentProblem.conflict,
    ApiFailureType.validation => AppointmentProblem.validation,
    ApiFailureType.malformedResponse => AppointmentProblem.malformed,
    ApiFailureType.unavailable || ApiFailureType.server =>
      mutation
          ? AppointmentProblem.unknownOutcome
          : AppointmentProblem.unavailable,
    _ => AppointmentProblem.unknown,
  };

  static void _uuidValue(String value) {
    if (!_uuid.hasMatch(value)) {
      throw const AppointmentFailure(AppointmentProblem.validation);
    }
  }
}

class UnavailablePatientAppointmentsRepository
    implements PatientAppointmentsRepository {
  const UnavailablePatientAppointmentsRepository();
  Never _unavailable() =>
      throw const AppointmentFailure(AppointmentProblem.unavailable);
  @override
  Future<PatientAppointment> cancel(
    AppointmentCancellation command,
    String operationId,
  ) async => _unavailable();
  @override
  Future<PatientAppointment> detail(
    String appointmentId,
    PatientProfileId profileId,
  ) async => _unavailable();
  @override
  Future<AppointmentPage> list(AppointmentListRequest request) async =>
      _unavailable();
  @override
  Future<PatientAppointment> reschedule(
    AppointmentReschedule command,
    String operationId,
  ) async => _unavailable();
}
