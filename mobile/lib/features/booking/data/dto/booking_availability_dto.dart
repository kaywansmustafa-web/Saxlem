class BookingClinicDto {
  const BookingClinicDto({
    required this.id,
    required this.name,
    required this.city,
    required this.area,
    required this.timezone,
    required this.feeIqd,
    required this.durationMinutes,
    required this.policy,
  });
  final String id, name, city, area, timezone, policy;
  final int feeIqd, durationMinutes;
}

class BookingDayDto {
  const BookingDayDto({
    required this.date,
    required this.status,
    required this.slots,
  });
  final DateTime date;
  final String status;
  final List<BookingSlotDto> slots;
}

class BookingSlotDto {
  const BookingSlotDto({
    required this.id,
    required this.clinicId,
    required this.start,
    required this.end,
    required this.status,
    required this.version,
  });
  final String id, clinicId, status;
  final DateTime start, end;
  final int version;
}

class BookingAvailabilityDto {
  const BookingAvailabilityDto({
    required this.clinicId,
    required this.version,
    required this.days,
  });
  final String clinicId;
  final int version;
  final List<BookingDayDto> days;
}
