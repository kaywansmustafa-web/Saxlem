class BookingClinicOption {
  const BookingClinicOption({
    required this.id,
    required this.displayName,
    required this.cityDisplayName,
    required this.areaDisplayName,
    required this.timezone,
    required this.consultationFeeIqd,
    required this.durationMinutes,
    required this.cancellationPolicy,
  });
  final String id,
      displayName,
      cityDisplayName,
      areaDisplayName,
      timezone,
      cancellationPolicy;
  final int consultationFeeIqd, durationMinutes;
}
