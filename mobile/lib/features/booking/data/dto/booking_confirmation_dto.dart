class BookingConfirmationDto {
  const BookingConfirmationDto({
    required this.id,
    required this.confirmedAt,
    required this.nextStep,
  });
  final String id, nextStep;
  final DateTime confirmedAt;
}
