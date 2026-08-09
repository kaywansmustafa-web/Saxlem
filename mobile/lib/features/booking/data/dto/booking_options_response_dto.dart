import '../../domain/entities/appointment_slot.dart';
import '../../domain/entities/booking_availability.dart';
import '../../domain/entities/booking_types.dart';

class BookingOptionsResponseDto {
  static final _uuid = RegExp(
    r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$',
  );
  static final _date = RegExp(r'^\d{4}-\d{2}-\d{2}$');
  static final _instant = RegExp(
    r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$',
  );
  static final _timezone = RegExp(r'^[A-Za-z_]+(?:/[A-Za-z0-9_+.-]+)+$');

  static BookingAvailability parse(Map<String, dynamic> json) {
    const keys = {
      'doctorId',
      'doctorName',
      'organizationId',
      'clinicId',
      'clinicName',
      'clinicTimezone',
      'appointmentType',
      'durationMinutes',
      'feeIqd',
      'currency',
      'dateFrom',
      'dateTo',
      'days',
      'generatedAt',
    };
    if (json.keys.toSet().difference(keys).isNotEmpty ||
        keys.difference(json.keys.toSet()).isNotEmpty) {
      throw const FormatException('Invalid booking options response.');
    }
    final doctorId = _uuidValue(json, 'doctorId');
    final organizationId = _uuidValue(json, 'organizationId');
    final clinicId = _uuidValue(json, 'clinicId');
    final doctorName = _text(json, 'doctorName');
    final clinicName = _text(json, 'clinicName');
    final timezone = _text(json, 'clinicTimezone');
    if (!_timezone.hasMatch(timezone)) throw const FormatException();
    final type = switch (json['appointmentType']) {
      'initial' => BookingAppointmentType.initial,
      'followUp' => BookingAppointmentType.followUp,
      _ => throw const FormatException(),
    };
    final duration = _integer(
      json,
      'durationMinutes',
      minimum: 5,
      maximum: 480,
    );
    final fee = _integer(json, 'feeIqd', minimum: 0);
    if (json['currency'] != 'IQD') throw const FormatException();
    final from = _localDate(json, 'dateFrom');
    final to = _localDate(json, 'dateTo');
    if (to.isBefore(from) || to.difference(from).inDays >= 31) {
      throw const FormatException();
    }
    final generatedAt = _dateTime(json, 'generatedAt');
    final rawDays = json['days'];
    if (rawDays is! List || rawDays.length > 31) throw const FormatException();
    final days = <BookingDay>[];
    DateTime? previousDay;
    final seen = <String>{};
    for (final rawDay in rawDays) {
      if (rawDay is! Map<String, dynamic> ||
          rawDay.keys.toSet().difference({'date', 'slots'}).isNotEmpty ||
          !rawDay.containsKey('date') ||
          !rawDay.containsKey('slots')) {
        throw const FormatException();
      }
      final date = _localDate(rawDay, 'date');
      if (date.isBefore(from) ||
          date.isAfter(to) ||
          (previousDay != null && !date.isAfter(previousDay))) {
        throw const FormatException();
      }
      previousDay = date;
      final rawSlots = rawDay['slots'];
      if (rawSlots is! List || rawSlots.length > 256) {
        throw const FormatException();
      }
      final slots = <AppointmentSlot>[];
      DateTime? previousSlot;
      for (final rawSlot in rawSlots) {
        if (rawSlot is! Map<String, dynamic> ||
            rawSlot.keys.toSet().difference({
              'startsAt',
              'endsAt',
              'durationMinutes',
            }).isNotEmpty) {
          throw const FormatException();
        }
        final startsAt = _dateTime(rawSlot, 'startsAt');
        final endsAt = _dateTime(rawSlot, 'endsAt');
        final slotDuration = _integer(rawSlot, 'durationMinutes', minimum: 1);
        if (!endsAt.isAfter(startsAt) ||
            endsAt.difference(startsAt).inMinutes != slotDuration ||
            slotDuration != duration ||
            !_belongsToDay(
              startsAt,
              date,
              timezone,
              rawSlot['startsAt'] as String,
            ) ||
            previousSlot != null && !startsAt.isAfter(previousSlot) ||
            !seen.add(startsAt.toUtc().toIso8601String())) {
          throw const FormatException();
        }
        previousSlot = startsAt;
        slots.add(
          AppointmentSlot(
            startsAt: startsAt,
            endsAt: endsAt,
            durationMinutes: slotDuration,
          ),
        );
      }
      days.add(BookingDay(date: date, slots: List.unmodifiable(slots)));
    }
    final expectedDayCount = to.difference(from).inDays + 1;
    if (days.length != expectedDayCount ||
        days.isEmpty ||
        days.first.date != from ||
        days.last.date != to) {
      throw const FormatException();
    }
    return BookingAvailability(
      doctorId: doctorId,
      doctorName: doctorName,
      organizationId: organizationId,
      clinicId: clinicId,
      clinicName: clinicName,
      clinicTimezone: timezone,
      appointmentType: type,
      durationMinutes: duration,
      feeIqd: fee,
      currency: 'IQD',
      dateFrom: from,
      dateTo: to,
      days: List.unmodifiable(days),
      generatedAt: generatedAt,
    );
  }

  static String _uuidValue(Map<String, dynamic> json, String key) {
    final value = _text(json, key);
    if (!_uuid.hasMatch(value)) throw const FormatException();
    return value;
  }

  static String _text(Map<String, dynamic> json, String key) {
    final value = json[key];
    if (value is! String || value.trim().isEmpty || value.length > 256) {
      throw const FormatException();
    }
    return value;
  }

  static int _integer(
    Map<String, dynamic> json,
    String key, {
    required int minimum,
    int? maximum,
  }) {
    final value = json[key];
    if (value is! int ||
        value < minimum ||
        maximum != null && value > maximum) {
      throw const FormatException();
    }
    return value;
  }

  static DateTime _localDate(Map<String, dynamic> json, String key) {
    final value = json[key];
    if (value is! String || !_date.hasMatch(value)) {
      throw const FormatException();
    }
    final result = DateTime.tryParse('${value}T00:00:00Z');
    if (result == null || result.toIso8601String().substring(0, 10) != value) {
      throw const FormatException();
    }
    return result;
  }

  static DateTime _dateTime(Map<String, dynamic> json, String key) {
    final value = json[key];
    if (value is! String || !_instant.hasMatch(value)) {
      throw const FormatException();
    }
    final result = DateTime.tryParse(value);
    if (result == null) throw const FormatException();
    return result;
  }

  static bool _belongsToDay(
    DateTime instant,
    DateTime day,
    String timezone,
    String source,
  ) {
    if (!source.endsWith('Z')) {
      return source.substring(0, 10) ==
          '${day.year.toString().padLeft(4, '0')}-'
              '${day.month.toString().padLeft(2, '0')}-'
              '${day.day.toString().padLeft(2, '0')}';
    }
    if (timezone != 'Asia/Baghdad') return true;
    final local = instant.toUtc().add(const Duration(hours: 3));
    return local.year == day.year &&
        local.month == day.month &&
        local.day == day.day;
  }
}
